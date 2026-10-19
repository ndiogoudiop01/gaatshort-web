import { ApiError, isApiError } from '../api-error';
import { isCursorMeta, isErrorEnvelope, isOffsetMeta, isSuccessEnvelope } from '../envelope';

describe('ApiError', () => {
  it('lit les messages de validation dans details.issues ou details.errors', () => {
    expect(
      new ApiError({ code: 'X', message: '', status: 400, details: { issues: ['a', 1] } }).issues,
    ).toEqual(['a']);
    expect(
      new ApiError({ code: 'X', message: '', status: 422, details: { errors: ['b'] } }).issues,
    ).toEqual(['b']);
    expect(new ApiError({ code: 'X', message: '', status: 400 }).issues).toEqual([]);
  });

  it('traite une 404 comme « absent de ce pays »', () => {
    expect(new ApiError({ code: 'RESOURCE_NOT_FOUND', message: '', status: 404 }).isNotFound).toBe(
      true,
    );
    expect(new ApiError({ code: 'X', message: '', status: 404 }).isNotFound).toBe(true);
    expect(new ApiError({ code: 'X', message: '', status: 400 }).isNotFound).toBe(false);
  });

  it('ne considère « indisponible » que les pannes, pas les refus', () => {
    expect(new ApiError({ code: 'X', message: '', status: 503 }).isUnavailable).toBe(true);
    expect(
      new ApiError({ code: 'UPSTREAM_UNAVAILABLE', message: '', status: 424 }).isUnavailable,
    ).toBe(true);
    expect(new ApiError({ code: 'INTERNAL_ERROR', message: '', status: 500 }).isUnavailable).toBe(
      false,
    );
    expect(
      new ApiError({ code: 'RATE_LIMIT_EXCEEDED', message: '', status: 429 }).isUnavailable,
    ).toBe(false);
  });

  it("se construit depuis une enveloppe d'erreur ou une réponse inattendue", () => {
    const fromEnvelope = ApiError.fromResponse(409, {
      success: false,
      error: { code: 'DUPLICATE_RESOURCE', message: 'm' },
      requestId: 'r',
      timestamp: '',
    });
    expect(fromEnvelope.code).toBe('DUPLICATE_RESOURCE');
    expect(ApiError.fromResponse(502, '<html>').code).toBe('INVALID_RESPONSE');
    expect(isApiError(fromEnvelope)).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
  });
});

describe('envelope', () => {
  it('reconnaît les deux formes et les deux paginations', () => {
    expect(isSuccessEnvelope({ success: true, data: 1 })).toBe(true);
    expect(isSuccessEnvelope(null)).toBe(false);
    expect(isErrorEnvelope({ success: false, error: { code: 'X' } })).toBe(true);
    expect(isErrorEnvelope({ success: false })).toBe(false);
    expect(isErrorEnvelope('x')).toBe(false);
    expect(isOffsetMeta({ total: 3, page: 1, perPage: 20, totalPages: 1, hasMore: false })).toBe(
      true,
    );
    expect(isCursorMeta({ nextCursor: null, hasMore: false })).toBe(true);
    expect(isCursorMeta(undefined)).toBe(false);
  });
});
