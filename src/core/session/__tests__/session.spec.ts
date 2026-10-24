import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = new Map<string, { value: string; options?: Record<string, unknown> }>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (n: string) => (jar.has(n) ? { value: jar.get(n)!.value } : undefined),
    set: (n: string, value: string, options: Record<string, unknown>) =>
      jar.set(n, { value, options }),
    delete: (n: string) => jar.delete(n),
  }),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock('../../config/env', () => ({ env: () => ({ APP_ENV: 'development' }) }));
const apiRequest = vi.fn();
vi.mock('../../http/client', () => ({ apiRequest: (...a: unknown[]) => apiRequest(...a) }));

const {
  actionAccessToken,
  clearSession,
  isAuthError,
  pageAccessToken,
  readSession,
  refreshTokens,
  viewerRequest,
  writeSession,
} = await import('../session');
const { ApiError } = await import('../../http/api-error');

const jwt = (expSecondsFromNow: number) => {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }),
  ).toString('base64url');
  return `h.${payload}.s`;
};

beforeEach(() => {
  jar.clear();
  apiRequest.mockReset();
});

describe('session par cookies', () => {
  it('écrit des cookies httpOnly, lit et efface la session', async () => {
    await writeSession({ accessToken: 'a', refreshToken: 'r', expiresIn: 900 }, '+221770000000');
    expect(jar.get('gs_at')?.options).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 900,
      path: '/',
    });
    expect(jar.get('gs_rt')?.options).toMatchObject({ maxAge: 30 * 86_400 });
    await expect(readSession()).resolves.toEqual({
      accessToken: 'a',
      refreshToken: 'r',
      phone: '+221770000000',
    });
    await clearSession();
    await expect(readSession()).resolves.toEqual({
      accessToken: null,
      refreshToken: null,
      phone: null,
    });
  });

  it('page : jeton valide servi, anonyme sans cookie, redirection de renouvellement sinon', async () => {
    await expect(pageAccessToken('/')).resolves.toBeNull();
    jar.set('gs_at', { value: jwt(600) });
    await expect(pageAccessToken('/')).resolves.toBe(jar.get('gs_at')!.value);
    jar.set('gs_at', { value: jwt(5) });
    jar.set('gs_rt', { value: 'r' });
    await expect(pageAccessToken('/serie/x')).rejects.toThrow(
      'REDIRECT /session/refresh?next=%2Fserie%2Fx',
    );
    await expect(pageAccessToken('https://evil.example')).rejects.toThrow(
      'REDIRECT /session/refresh?next=%2F',
    );
  });

  it('action : renouvelle sur place et réécrit les cookies ; échec → session effacée', async () => {
    await expect(actionAccessToken()).resolves.toBeNull();
    jar.set('gs_rt', { value: 'r1' });
    jar.set('gs_ph', { value: '+221770000000' });
    apiRequest.mockResolvedValueOnce({
      data: { accessToken: 'a2', refreshToken: 'r2', expiresIn: 900 },
    });
    await expect(actionAccessToken()).resolves.toBe('a2');
    expect(apiRequest).toHaveBeenCalledWith({
      path: 'auth/refresh',
      method: 'POST',
      body: { refreshToken: 'r1' },
    });
    expect(jar.get('gs_rt')?.value).toBe('r2');

    jar.delete('gs_at');
    apiRequest.mockRejectedValueOnce(new Error('révoqué'));
    await expect(actionAccessToken()).resolves.toBeNull();
    expect(jar.size).toBe(0);
  });

  it('refreshTokens renvoie null en cas d’échec ; viewerRequest transmet le jeton', async () => {
    apiRequest.mockRejectedValueOnce(new Error('x'));
    await expect(refreshTokens('r')).resolves.toBeNull();
    apiRequest.mockResolvedValue({ data: 1 });
    await viewerRequest('tok', { path: 'wallet' });
    await viewerRequest(null, { path: 'storefront/home' });
    expect(apiRequest.mock.calls.slice(1).map((c) => c[0].accessToken)).toEqual(['tok', undefined]);
  });

  it('isAuthError', () => {
    expect(isAuthError(new ApiError({ code: 'UNAUTHENTICATED', message: '', status: 401 }))).toBe(
      true,
    );
    expect(isAuthError(new ApiError({ code: 'X', message: '', status: 403 }))).toBe(false);
    expect(isAuthError(new Error())).toBe(false);
  });
});
