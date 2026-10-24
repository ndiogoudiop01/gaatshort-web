/**
 * Lecture (SANS vérification) de l'échéance d'un JWT. Sert uniquement à décider s'il faut
 * rafraîchir avant d'appeler l'API ; l'API, elle, vérifie la signature à chaque requête.
 */
export function jwtExpiry(token: string | undefined | null): number | null {
  if (!token) return null;
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as {
      exp?: unknown;
    };
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

/** Expiré, ou expire dans moins de `marginSeconds`. */
export function isExpiring(
  token: string | undefined | null,
  nowSeconds = Date.now() / 1000,
  marginSeconds = 30,
): boolean {
  const exp = jwtExpiry(token);
  return exp === null || exp - marginSeconds <= nowSeconds;
}

/** Chemin de retour sûr : relatif au site, jamais `//autre-domaine` ni une URL absolue. */
export function safeNext(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\'))
    return fallback;
  return next;
}
