import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '../config/env';
import { ApiError } from '../http/api-error';
import { apiRequest, type ApiRequest, type ApiResponse } from '../http/client';
import { isExpiring, safeNext } from './jwt';

/**
 * Session du spectateur sur le site : jetons dans des cookies `httpOnly` (jamais lisibles par
 * le JavaScript de la page), posés par le SERVEUR Next sur le domaine de la marque.
 *
 *  • Les pages (Server Components) ne peuvent pas écrire de cookie : si le jeton d'accès est
 *    expiré, elles redirigent vers `/session/refresh?next=…`, qui le renouvelle et revient.
 *  • Les Server Actions peuvent écrire : elles rafraîchissent sur place.
 */
const ACCESS = 'gs_at';
const REFRESH = 'gs_rt';
const PHONE = 'gs_ph';
const THIRTY_DAYS = 30 * 86_400;

export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}

export interface Session {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly phone: string | null;
}

export async function readSession(): Promise<Session> {
  const jar = await cookies();
  return {
    accessToken: jar.get(ACCESS)?.value ?? null,
    refreshToken: jar.get(REFRESH)?.value ?? null,
    phone: jar.get(PHONE)?.value ?? null,
  };
}

const secure = () => env().APP_ENV !== 'development';

export async function writeSession(tokens: TokenPair, phone?: string | null): Promise<void> {
  const jar = await cookies();
  const base = { httpOnly: true, secure: secure(), sameSite: 'lax' as const, path: '/' };
  jar.set(ACCESS, tokens.accessToken, { ...base, maxAge: Math.max(60, tokens.expiresIn) });
  jar.set(REFRESH, tokens.refreshToken, { ...base, maxAge: THIRTY_DAYS });
  if (phone) jar.set(PHONE, phone, { ...base, maxAge: THIRTY_DAYS });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  for (const name of [ACCESS, REFRESH, PHONE]) jar.delete(name);
}

/** Rotation du jeton de rafraîchissement (le backend révoque la famille en cas de rejeu). */
export async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  try {
    const { data } = await apiRequest<TokenPair>({
      path: 'auth/refresh',
      method: 'POST',
      body: { refreshToken },
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * Jeton d'accès valide pour une PAGE. `null` : visiteur anonyme. Jeton expiré avec un jeton de
 * rafraîchissement : redirection vers le renouvellement, puis retour sur `currentPath`.
 */
export async function pageAccessToken(currentPath: string): Promise<string | null> {
  const s = await readSession();
  if (s.accessToken && !isExpiring(s.accessToken)) return s.accessToken;
  if (s.refreshToken)
    redirect(`/session/refresh?next=${encodeURIComponent(safeNext(currentPath))}`);
  return null;
}

/** Jeton d'accès valide pour une ACTION (rafraîchit et réécrit les cookies au besoin). */
export async function actionAccessToken(): Promise<string | null> {
  const s = await readSession();
  if (s.accessToken && !isExpiring(s.accessToken)) return s.accessToken;
  if (!s.refreshToken) return null;
  const next = await refreshTokens(s.refreshToken);
  if (!next) {
    await clearSession();
    return null;
  }
  await writeSession(next, s.phone);
  return next.accessToken;
}

/** Requête API au nom du visiteur (anonyme si `token` est nul). */
export function viewerRequest<T>(
  token: string | null,
  request: ApiRequest,
): Promise<ApiResponse<T>> {
  return apiRequest<T>({ ...request, accessToken: token ?? undefined });
}

export const isAuthError = (e: unknown) =>
  e instanceof ApiError && (e.status === 401 || e.code === 'UNAUTHENTICATED');
