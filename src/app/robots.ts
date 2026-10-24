import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { env } from '@core/config/env';

export const dynamic = 'force-dynamic';

/** Hors production, aucune indexation : une recette indexée ferait concurrence aux vrais sites des marques. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (env().APP_ENV !== 'production') return { rules: { userAgent: '*', disallow: '/' } };
  const host = (await headers()).get('host');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/regarder/',
        '/connexion',
        '/profil',
        '/ma-liste',
        '/boutique/retour',
        '/session/',
      ],
    },
    sitemap: host ? `https://${host}/sitemap.xml` : undefined,
  };
}
