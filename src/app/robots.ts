import type { MetadataRoute } from 'next';
import { env } from '@core/config/env';

export const dynamic = 'force-dynamic';

/** Hors production, aucune indexation : une recette indexée ferait concurrence aux vrais sites des marques. */
export default function robots(): MetadataRoute.Robots {
  if (env().APP_ENV !== 'production') return { rules: { userAgent: '*', disallow: '/' } };
  // Sitemap par marque : ajouté avec les fiches série (FR-CAT-008, T3.5).
  return { rules: { userAgent: '*', allow: '/' } };
}
