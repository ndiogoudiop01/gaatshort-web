import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { env } from '@core/config/env';
import { viewerRequest } from '@core/session/session';
import type { SeriesCard } from '@modules/viewer/types';

/** Plan du site PAR MARQUE (l'hôte décide) : accueil, découverte et fiches série. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host');
  const base = host
    ? `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`
    : env().SITE_URL;
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/decouvrir`, changeFrequency: 'daily', priority: 0.7 },
  ];
  try {
    for (let page = 1; page <= 20; page++) {
      const r = await viewerRequest<SeriesCard[]>(null, {
        path: 'storefront/series',
        query: { page, perPage: 100, locale: 'fr' },
      });
      pages.push(
        ...r.data.map((s) => ({
          url: `${base}/serie/${s.slug}`,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })),
      );
      if (!r.meta?.hasMore) break;
    }
  } catch {
    // API indisponible : on publie au moins les pages fixes.
  }
  return pages;
}
