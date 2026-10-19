import { currencyDecimals, formatMoney, fromMinor, toMinor } from '../money';
import { toE164 } from '../phone';

describe('money', () => {
  it('sait que le franc CFA n’a pas de décimales', () => {
    expect(currencyDecimals('XOF')).toBe(0);
    expect(currencyDecimals('EUR')).toBe(2);
    expect(currencyDecimals('GNF')).toBe(0);
  });

  it('convertit sans flottant résiduel', () => {
    expect(toMinor(1_500_000, 'XOF')).toBe(1_500_000);
    expect(toMinor(19.99, 'EUR')).toBe(1999);
    expect(fromMinor('2500000', 'XOF')).toBe(2_500_000);
    expect(fromMinor(1999n, 'EUR')).toBe(19.99);
  });

  it('écrit le FCFA selon la charte', () => {
    expect(formatMoney(2_500_000, 'XOF')).toBe('2 500 000 FCFA');
    expect(formatMoney('0', 'XOF')).toBe('0 FCFA');
  });

  it('formate les autres devises avec leur symbole', () => {
    expect(formatMoney(1999, 'EUR')).toMatch(/19,99 €/);
  });
});

describe('toE164', () => {
  it('ajoute l’indicatif du pays à un numéro local', () => {
    expect(toE164('77 123 45 67', '+221')).toBe('+221771234567');
    expect(toE164('070 00 00 00', '+223')).toBe('+22370000000');
  });

  it('garde un numéro déjà international, y compris en 00', () => {
    expect(toE164('+223 70 00 00 00', '+221')).toBe('+22370000000');
    expect(toE164('0033 6 12 34 56 78', '+221')).toBe('+33612345678');
  });

  it('refuse ce qui reste invalide après normalisation', () => {
    expect(toE164('', '+221')).toBeNull();
    expect(toE164('+0123', '+221')).toBeNull();
    expect(toE164('1234567890123456789', '+221')).toBeNull();
  });
});

describe('latinDigits', () => {
  it('convertit les chiffres arabes-indiens et persans', async () => {
    const { latinDigits } = await import('../digits');
    expect(latinDigits('٧٧ ١٢٣ ٤٥ ٦٧')).toBe('77 123 45 67');
    expect(latinDigits('۱۲۳')).toBe('123');
    expect(latinDigits('+221 77')).toBe('+221 77');
  });
});
