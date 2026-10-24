/** 754 → « 12 min » ; 45 → « 45 s ». */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  return `${Math.round(seconds / 60)} min`;
}

/** 1250 → « 1 250 » (espace insécable). */
export const formatCoins = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n).replace(/[   ]/g, ' ');

/** Pluriel français simple : « 1 épisode », « 12 épisodes ». */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

/** Couleur de marque acceptée seulement si c'est un hexadécimal : jamais de CSS arbitraire injecté. */
export function safeHexColor(value: unknown): string | null {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : null;
}
