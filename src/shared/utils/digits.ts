/**
 * Chiffres arabes-indiens (٠١٢…) et persans (۰۱۲…) → chiffres latins.
 *
 * Un visiteur qui saisit en arabe peut taper « ٧٧ ١٢٣ ٤٥ ٦٧ » : la valeur doit
 * être comprise comme 77 123 45 67 avant d'être validée ou envoyée à l'API.
 */
export const latinDigits = (value: string): string =>
  value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
