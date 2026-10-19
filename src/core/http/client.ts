import 'server-only';
import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { env } from '../config/env';
import { tenantKeyFor } from '../tenancy/tenant-key';
import { ApiError } from './api-error';
import { isSuccessEnvelope, type PaginationMeta } from './envelope';

/**
 * Client de l'API, SERVEUR UNIQUEMENT (`server-only` fait échouer le build si un composant
 * client l'importe).
 *
 *  - La marque est déduite de l'HÔTE de la requête (`tenant-key.ts`), jamais d'un paramètre
 *    fourni par le navigateur.
 *  - `X-Forwarded-For` transmet l'adresse du VISITEUR : sans elle, tous les visiteurs
 *    partageraient l'adresse du serveur Next et les quotas par IP de l'API (OTP) bloqueraient
 *    tout le monde. Le serveur Next doit joindre l'API directement (le backend fait confiance
 *    à un seul saut).
 *  - Aucun cache de données Next (`no-store`) : la clé de cache de `fetch` ne sépare pas deux
 *    marques qui appellent la même URL. Le cache vit côté API, préfixé par tenant.
 */

type QueryValue = string | number | boolean | readonly (string | number)[] | null | undefined;

export interface ApiRequest {
  readonly path: string;
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  readonly query?: Record<string, QueryValue>;
  readonly body?: unknown;
  /**
   * Jeton d'un utilisateur connecté. Quand il est présent, l'identifiant de marque n'est PAS
   * envoyé : la revendication `tid` du jeton fait autorité, et un en-tête divergent serait
   * journalisé comme tentative de traversée de tenant.
   */
  readonly accessToken?: string;
  /** Création (`@Idempotent()` côté API) : `true` génère une clé, une chaîne la rejoue. */
  readonly idempotencyKey?: string | true;
}

export interface ApiResponse<T> {
  readonly data: T;
  readonly meta?: PaginationMeta;
  readonly requestId: string | null;
}

export async function apiRequest<T>(request: ApiRequest): Promise<ApiResponse<T>> {
  const config = env();
  const url = buildUrl(config.API_BASE_URL, request.path, request.query);
  const incoming = await incomingHeaders();

  const outgoing = new Headers({ accept: 'application/json' });
  if (request.body !== undefined) outgoing.set('content-type', 'application/json');
  if (request.accessToken) {
    outgoing.set('authorization', `Bearer ${request.accessToken}`);
  } else {
    const tenant = tenantKeyFor(incoming?.get('host'), config.DEV_TENANT);
    if (!tenant) {
      throw new ApiError({
        code: 'TENANT_NOT_RESOLVED',
        message: 'Marque introuvable pour cet hôte',
        status: 404,
      });
    }
    outgoing.set(config.TENANCY_HEADER_NAME, tenant);
  }
  if (request.idempotencyKey) {
    outgoing.set(
      'idempotency-key',
      request.idempotencyKey === true ? randomUUID() : request.idempotencyKey,
    );
  }
  forwardVisitor(incoming, outgoing);

  let response: Response;
  try {
    response = await fetch(url, {
      method: request.method ?? 'GET',
      headers: outgoing,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(config.API_TIMEOUT_MS),
    });
  } catch (error) {
    const timeout = error instanceof DOMException && error.name === 'TimeoutError';
    throw new ApiError({
      code: timeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: timeout ? "L'API n'a pas répondu à temps" : "L'API est injoignable",
      status: 0,
    });
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw ApiError.fromResponse(response.status, body);
  if (body === null) return { data: undefined as T, requestId: null };
  if (!isSuccessEnvelope<T>(body)) throw ApiError.fromResponse(response.status, body);
  return { data: body.data, meta: body.meta, requestId: body.requestId };
}

/** Raccourci pour les lectures : seule la donnée intéresse l'appelant. */
export async function apiGet<T>(path: string, query?: ApiRequest['query']): Promise<T> {
  return (await apiRequest<T>({ path, query })).data;
}

export function buildUrl(base: string, path: string, query?: ApiRequest['query']): string {
  const url = new URL(`${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) url.searchParams.append(key, String(item));
  }
  return url.toString();
}

async function incomingHeaders(): Promise<Headers | null> {
  try {
    return await headers();
  } catch {
    return null; // hors requête (build, script)
  }
}

function forwardVisitor(incoming: Headers | null, outgoing: Headers): void {
  if (!incoming) return;
  const clientIp =
    incoming.get('x-forwarded-for')?.split(',')[0]?.trim() || incoming.get('x-real-ip')?.trim();
  if (clientIp) outgoing.set('x-forwarded-for', clientIp);
  const userAgent = incoming.get('user-agent');
  if (userAgent) outgoing.set('user-agent', userAgent);
}
