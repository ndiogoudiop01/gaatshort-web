import type { MetadataRoute } from 'next';
import { storefrontConfig } from '@modules/viewer/data';

/** Application installable (écran d'accueil du téléphone), au nom de la marque servie. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await storefrontConfig().catch(() => null);
  const name = brand?.name ?? 'Gaatshort';
  return {
    name: `${name} — mini-séries`,
    short_name: name,
    description: 'Mini-séries dramatiques à regarder sur mobile.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f0b14',
    theme_color: '#0f0b14',
    lang: 'fr',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
