import { normalizeHost, tenantKeyFor } from '../tenant-key';

describe('normalizeHost', () => {
  it('met en minuscules et retire le port et le point final', () => {
    expect(normalizeHost('Kaay-Drama.Gaatshort.com:443')).toBe('kaay-drama.gaatshort.com');
    expect(normalizeHost('www.marque.sn.')).toBe('www.marque.sn');
  });

  it('refuse ce qui ne peut pas désigner une marque', () => {
    expect(normalizeHost(undefined)).toBeNull();
    expect(normalizeHost('')).toBeNull();
    expect(normalizeHost('localhost:3001')).toBeNull();
    expect(normalizeHost('127.0.0.1')).toBeNull();
    expect(normalizeHost('[::1]:3001')).toBeNull();
    expect(normalizeHost('web')).toBeNull();
  });

  it('refuse un hôte forgé avec des caractères inattendus', () => {
    expect(normalizeHost('evil.com/../admin')).toBeNull();
    expect(normalizeHost('a b.com')).toBeNull();
  });
});

describe('tenantKeyFor', () => {
  it("préfère toujours l'hôte réel à la marque de développement", () => {
    expect(tenantKeyFor('kaay-drama.gaatshort.com', 'gaatshort')).toBe('kaay-drama.gaatshort.com');
  });

  it('retombe sur la marque de développement pour localhost', () => {
    expect(tenantKeyFor('localhost:3001', 'gaatshort')).toBe('gaatshort');
  });

  it('renvoie null sans hôte exploitable ni marque de développement (production)', () => {
    expect(tenantKeyFor('localhost:3001')).toBeNull();
  });
});
