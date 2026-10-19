/**
 * Enveloppe de réponse de l'API (`response-envelope.interceptor.ts` et
 * `all-exceptions.filter.ts` côté backend). Toutes les routes publiques y
 * passent : `client.ts` déballe, le reste du site ne voit jamais cette forme.
 */

export interface OffsetMeta {
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
  readonly totalPages: number;
  readonly hasMore: boolean;
}

export interface CursorMeta {
  /** `null` quand il n'y a plus rien à charger. */
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export type PaginationMeta = OffsetMeta | CursorMeta;

export interface ApiSuccessEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: PaginationMeta;
  readonly requestId: string | null;
  readonly timestamp: string;
}

export interface ApiErrorEnvelope {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
  readonly requestId: string | null;
  readonly timestamp: string;
}

export const isSuccessEnvelope = <T>(body: unknown): body is ApiSuccessEnvelope<T> =>
  typeof body === 'object' && body !== null && (body as { success?: unknown }).success === true;

export const isErrorEnvelope = (body: unknown): body is ApiErrorEnvelope => {
  if (typeof body !== 'object' || body === null) return false;
  const candidate = body as Partial<ApiErrorEnvelope>;
  return (
    candidate.success === false &&
    typeof candidate.error === 'object' &&
    candidate.error !== null &&
    typeof candidate.error.code === 'string'
  );
};

export const isOffsetMeta = (meta: PaginationMeta | undefined): meta is OffsetMeta =>
  !!meta && typeof (meta as OffsetMeta).total === 'number';

export const isCursorMeta = (meta: PaginationMeta | undefined): meta is CursorMeta =>
  !!meta && 'nextCursor' in meta;
