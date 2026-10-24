import { isExpiring, jwtExpiry, safeNext } from '../jwt';

const token = (payload: object) =>
  `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;

describe('jwt', () => {
  it('lit l’échéance sans vérifier la signature', () => {
    expect(jwtExpiry(token({ exp: 1000 }))).toBe(1000);
    expect(jwtExpiry(token({}))).toBeNull();
    expect(jwtExpiry('pas-un-jwt')).toBeNull();
    expect(jwtExpiry('h.@@@.s')).toBeNull();
    expect(jwtExpiry(null)).toBeNull();
  });

  it('considère comme expiré un jeton qui expire dans la marge', () => {
    expect(isExpiring(token({ exp: 1100 }), 1000)).toBe(false);
    expect(isExpiring(token({ exp: 1020 }), 1000)).toBe(true);
    expect(isExpiring(undefined, 1000)).toBe(true);
  });

  it('n’accepte que des chemins de retour internes', () => {
    expect(safeNext('/serie/x?y=1')).toBe('/serie/x?y=1');
    expect(safeNext('//evil.example')).toBe('/');
    expect(safeNext('/\\evil')).toBe('/');
    expect(safeNext('https://evil.example')).toBe('/');
    expect(safeNext(null, '/profil')).toBe('/profil');
  });
});
