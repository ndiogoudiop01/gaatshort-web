/**
 * Sonde de vivacité du conteneur. Ne teste PAS l'API : une panne du backend
 * ne doit pas faire redémarrer le site en boucle — il sait déjà l'afficher
 * proprement (pages d'erreur, formulaires indisponibles).
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } });
}
