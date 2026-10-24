import { ApiError } from '@core/http/api-error';

/** Messages par CODE (jamais le texte brut renvoyé par l'API). */
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Service momentanément injoignable. Réessayez dans un instant.',
  TIMEOUT: 'Le service met trop de temps à répondre. Réessayez.',
  CHALLENGE_INVALID: 'Code incorrect ou expiré.',
  CHALLENGE_EXPIRED: 'Ce code a expiré : demandez-en un nouveau.',
  CHALLENGE_LOCKED: 'Trop d’essais : demandez un nouveau code.',
  RATE_LIMIT_EXCEEDED: 'Trop de demandes. Réessayez dans quelques minutes.',
  INSUFFICIENT_BALANCE: 'Crédits insuffisants pour cet épisode.',
  RESOURCE_NOT_FOUND: 'Contenu introuvable ou indisponible dans votre pays.',
  UPSTREAM_UNAVAILABLE: 'Le paiement est momentanément indisponible.',
  ACCOUNT_SUSPENDED: 'Ce compte est suspendu. Contactez l’assistance.',
  VALIDATION_FAILED: 'Les informations saisies sont invalides.',
};

export function messageFor(error: unknown): string {
  const code = error instanceof ApiError ? error.code : 'UNKNOWN';
  return MESSAGES[code] ?? 'Une erreur est survenue. Réessayez.';
}
