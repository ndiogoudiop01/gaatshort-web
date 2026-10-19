import { parseEnv } from '../env';

describe('parseEnv', () => {
  it('applique les valeurs par défaut de développement', () => {
    const env = parseEnv({});
    expect(env.APP_ENV).toBe('development');
    expect(env.API_BASE_URL).toBe('http://localhost:3000/api/v1');
    expect(env.TENANCY_HEADER_NAME).toBe('x-tenant-id');
    expect(env.DEV_TENANT).toBeUndefined();
  });

  it('ignore les chaînes vides plutôt que de les lire comme des valeurs', () => {
    expect(parseEnv({ DEV_TENANT: '  ' }).DEV_TENANT).toBeUndefined();
  });

  it('rejette une URL d’API invalide avec un message explicite', () => {
    expect(() => parseEnv({ API_BASE_URL: 'pas-une-url' })).toThrow(/API_BASE_URL/);
  });

  it('interdit DEV_TENANT en production : un hôte inconnu ne doit jamais afficher une autre marque', () => {
    expect(() => parseEnv({ APP_ENV: 'production', DEV_TENANT: 'gaatshort' })).toThrow(
      /DEV_TENANT/,
    );
    expect(parseEnv({ APP_ENV: 'staging', DEV_TENANT: 'gaatshort' }).DEV_TENANT).toBe('gaatshort');
  });
});
