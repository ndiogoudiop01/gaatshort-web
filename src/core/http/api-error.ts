import { isErrorEnvelope } from './envelope';

/**
 * Codes du catalogue backend (`src/shared/kernel/errors/error-catalog.ts`)
 * qu'un visiteur du site public peut rencontrer. Le type reste ouvert
 * (`string & {}`) : une `BusinessRuleViolationError` porte parfois un code
 * hors catalogue (`INVALID_PHONE_NUMBER`…).
 */
export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'CHALLENGE_INVALID'
  | 'CHALLENGE_EXPIRED'
  | 'CHALLENGE_LOCKED'
  | 'CHALLENGE_ALREADY_USED'
  | 'UNAUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'RESOURCE_NOT_FOUND'
  | 'TENANT_NOT_RESOLVED'
  | 'TENANT_SUSPENDED'
  | 'DUPLICATE_RESOURCE'
  | 'IDEMPOTENCY_IN_PROGRESS'
  | 'IDEMPOTENCY_PAYLOAD_MISMATCH'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CONSENT_REQUIRED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  /** Synthétiques : l'API n'a pas répondu, ou pas avec une enveloppe. */
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | (string & {});

/**
 * Erreur normalisée : tout échec d'appel à l'API en est une, y compris une
 * panne réseau ou un délai dépassé. Les pages et les actions n'ont donc qu'un
 * seul cas à traiter.
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  public readonly requestId: string | null;

  constructor(params: {
    code: ApiErrorCode;
    message: string;
    status: number;
    details?: Record<string, unknown>;
    requestId?: string | null;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
    this.requestId = params.requestId ?? null;
  }

  /**
   * Messages de validation. Ils vivent dans `error.details.issues` —
   * `error.message` vaut la chaîne fixe « Requête invalide ».
   */
  get issues(): string[] {
    const issues = this.details?.issues ?? this.details?.errors;
    return Array.isArray(issues) ? issues.filter((i): i is string => typeof i === 'string') : [];
  }

  /**
   * Une 404 ne dit pas « n'existe pas » : elle dit aussi « appartient à un
   * autre tenant » (le backend ne confirme jamais l'existence d'une ressource
   * étrangère). Pour le site, c'est la même chose : la page n'existe pas dans
   * CE pays.
   */
  get isNotFound(): boolean {
    return this.code === 'RESOURCE_NOT_FOUND' || this.status === 404;
  }

  /** L'API est injoignable ou en panne : le repli sur contenu embarqué est légitime. */
  get isUnavailable(): boolean {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'TIMEOUT' ||
      this.code === 'UPSTREAM_UNAVAILABLE' ||
      this.status >= 502
    );
  }

  static fromResponse(status: number, body: unknown): ApiError {
    if (isErrorEnvelope(body)) {
      return new ApiError({
        code: body.error.code,
        message: body.error.message,
        status,
        details: body.error.details,
        requestId: body.requestId,
      });
    }
    return new ApiError({
      code: 'INVALID_RESPONSE',
      message: `Réponse inattendue de l'API (HTTP ${status})`,
      status,
    });
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
