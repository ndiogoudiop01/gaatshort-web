/**
 * Montants en unités mineures, comme les stocke et les renvoie l'API
 * (`minContributionMinor`, `monthlyRevenueMinor`… — VO `Money` côté backend).
 *
 * Le nombre de décimales vient d'`Intl`, pas d'une table maison : XOF et GNF
 * en ont 0, EUR et MAD 2. Le backend s'est fait prendre par une table figée
 * qui avait oublié GNF (SIB-22) ; on ne reproduit pas la deuxième source de
 * vérité ici.
 */

export const currencyDecimals = (currencyCode: string): number =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyCode }).resolvedOptions()
    .maximumFractionDigits ?? 0;

const toNumber = (value: number | string | bigint): number =>
  typeof value === 'number' ? value : Number(value);

/** 150000000 (minor, XOF) → 150000000 ; 1999 (minor, EUR) → 19.99 */
export const fromMinor = (minor: number | string | bigint, currencyCode: string): number =>
  toNumber(minor) / 10 ** currencyDecimals(currencyCode);

/** Saisie utilisateur (unité majeure) → unités mineures entières, sans flottant résiduel. */
export const toMinor = (major: number, currencyCode: string): number =>
  Math.round(major * 10 ** currencyDecimals(currencyCode));

/**
 * `formatMoney(2500000, 'XOF')` → « 2 500 000 FCFA ».
 *
 * Le symbole ISO de XOF (« F CFA » selon les moteurs) est remplacé par
 * « FCFA », la graphie de la charte. Les espaces fines insécables d'`Intl`
 * sont normalisées en espaces insécables, que toutes les polices dessinent.
 */
export function formatMoney(
  minor: number | string | bigint,
  currencyCode: string,
  locale = 'fr-FR',
): string {
  const amount = fromMinor(minor, currencyCode);
  if (currencyCode === 'XOF' || currencyCode === 'XAF') {
    const digits = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
    return `${normalizeSpaces(digits)} FCFA`;
  }
  return normalizeSpaces(
    new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount),
  );
}

const normalizeSpaces = (value: string) => value.replace(/[   ]/g, ' ');
