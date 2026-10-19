import { headers } from 'next/headers';
import { apiGet, apiRequest } from '../client';
import { isApiError } from '../api-error';

vi.mock('next/headers', () => ({ headers: vi.fn() }));

const mockedHeaders = vi.mocked(headers);

function incoming(values: Record<string, string>): void {
  mockedHeaders.mockResolvedValue(new Headers(values) as never);
}

function okJson(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data, requestId: 'req-1', timestamp: '2026-10-19T00:00:00Z' }),
    { status, headers: { 'content-type': 'application/json' } },
  );
}

describe('apiRequest', () => {
  const fetchMock = vi.fn();

  // L'environnement est lu une seule fois (cache) : on le fige AVANT le premier appel, pour que
  // le test ne dépende pas des variables de la machine qui l'exécute.
  beforeAll(() => {
    vi.stubEnv('APP_ENV', 'development');
    vi.stubEnv('API_BASE_URL', 'http://localhost:3000/api/v1');
    vi.stubEnv('API_TIMEOUT_MS', '8000');
    vi.stubEnv('TENANCY_HEADER_NAME', 'x-tenant-id');
    vi.stubEnv('DEV_TENANT', '');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    mockedHeaders.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("transmet l'hôte comme identifiant de marque, l'IP et le navigateur du visiteur", async () => {
    incoming({
      host: 'kaay-drama.gaatshort.com',
      'x-forwarded-for': '41.82.10.1, 10.0.0.2',
      'user-agent': 'Mozilla/5.0',
    });
    fetchMock.mockResolvedValue(okJson({ rows: [] }));

    const result = await apiRequest<{ rows: unknown[] }>({ path: 'storefront/home' });

    expect(result).toEqual({ data: { rows: [] }, meta: undefined, requestId: 'req-1' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/v1/storefront/home');
    const sent = init.headers as Headers;
    expect(sent.get('x-tenant-id')).toBe('kaay-drama.gaatshort.com');
    expect(sent.get('x-forwarded-for')).toBe('41.82.10.1');
    expect(sent.get('user-agent')).toBe('Mozilla/5.0');
    expect(init.cache).toBe('no-store');
  });

  it("n'envoie AUCUN identifiant de marque quand un jeton est présent (le jeton fait autorité)", async () => {
    incoming({ host: 'kaay-drama.gaatshort.com' });
    fetchMock.mockResolvedValue(okJson({ id: 'u1' }));

    await apiRequest({ path: 'auth/me', accessToken: 'jwt-123' });

    const sent = (fetchMock.mock.calls[0] as [string, RequestInit])[1].headers as Headers;
    expect(sent.get('authorization')).toBe('Bearer jwt-123');
    expect(sent.get('x-tenant-id')).toBeNull();
  });

  it("refuse d'appeler l'API quand l'hôte ne désigne aucune marque", async () => {
    incoming({ host: 'localhost:3001' });

    const error = await apiRequest({ path: 'storefront/home' }).catch((e: unknown) => e);

    expect(isApiError(error) && error.code).toBe('TENANT_NOT_RESOLVED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pose une clé d'idempotence et sérialise le corps des créations", async () => {
    incoming({ host: 'kaay-drama.gaatshort.com' });
    fetchMock.mockResolvedValue(okJson({ orderId: 'o1' }, 201));

    await apiRequest({
      path: 'billing/orders',
      method: 'POST',
      body: { packId: 'p2' },
      idempotencyKey: 'k-1',
    });

    const init = (fetchMock.mock.calls[0] as [string, RequestInit])[1];
    expect((init.headers as Headers).get('idempotency-key')).toBe('k-1');
    expect((init.headers as Headers).get('content-type')).toBe('application/json');
    expect(init.body).toBe('{"packId":"p2"}');
  });

  it('génère une clé d’idempotence quand on demande `true`', async () => {
    incoming({ host: 'kaay-drama.gaatshort.com' });
    fetchMock.mockResolvedValue(okJson({}));

    await apiRequest({ path: 'billing/orders', method: 'POST', body: {}, idempotencyKey: true });

    const key = ((fetchMock.mock.calls[0] as [string, RequestInit])[1].headers as Headers).get(
      'idempotency-key',
    );
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("traduit une erreur d'API en ApiError avec le code du catalogue", async () => {
    incoming({ host: 'kaay-drama.gaatshort.com' });
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'x' },
          requestId: 'r',
          timestamp: 't',
        }),
        { status: 404 },
      ),
    );

    const error = await apiGet('storefront/series/inconnue').catch((e: unknown) => e);

    expect(isApiError(error) && error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('signale une panne réseau et un délai dépassé sans laisser fuiter d’exception brute', async () => {
    incoming({ host: 'kaay-drama.gaatshort.com' });
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const network = await apiGet('storefront/home').catch((e: unknown) => e);
    expect(isApiError(network) && network.code).toBe('NETWORK_ERROR');

    fetchMock.mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'));
    const timeout = await apiGet('storefront/home').catch((e: unknown) => e);
    expect(isApiError(timeout) && timeout.code).toBe('TIMEOUT');
  });

  it('accepte une réponse sans corps (204)', async () => {
    incoming({ host: 'kaay-drama.gaatshort.com' });
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await apiRequest({ path: 'auth/logout', method: 'POST' });

    expect(result).toEqual({ data: undefined, requestId: null });
  });

  it('fonctionne hors requête (build) : pas d’en-têtes entrants, marque de développement absente → refus', async () => {
    mockedHeaders.mockRejectedValue(new Error('outside request scope'));

    const error = await apiGet('storefront/home').catch((e: unknown) => e);

    expect(isApiError(error) && error.code).toBe('TENANT_NOT_RESOLVED');
  });
});
