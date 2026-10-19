import { latinDigits } from './digits';

const E164 = /^\+[1-9]\d{1,14}$/;

/**
 * Numéro saisi localement → E.164, avec l'indicatif du pays affiché.
 *
 *   toE164('77 123 45 67', '+221')    → '+221771234567'
 *   toE164('0033 6 12 34 56 78', '+221') → '+33612345678'
 *   toE164('+223 70 00 00 00', '+221') → '+22370000000'
 *
 * Même règle que `LocalizationService.toE164` côté API (SIB-22), appliquée
 * AVANT l'envoi : l'API valide `@IsPhoneNumber()` et rejetterait un numéro
 * local. Renvoie `null` quand le résultat n'est toujours pas un E.164 valide
 * — on ne transmet jamais une « meilleure tentative ».
 */
export function toE164(raw: string, dialCode: string): string | null {
  const trimmed = latinDigits(raw).trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  const normalized = digits.startsWith('+') ? digits : `${dialCode}${digits.replace(/^0+/, '')}`;
  return E164.test(normalized) ? normalized : null;
}
