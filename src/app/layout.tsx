import type { Metadata, Viewport } from 'next';
import '@shared/styles/globals.css';

export const metadata: Metadata = {
  title: 'Gaatshort',
  description: 'Mini-séries dramatiques à regarder sur mobile.',
};

export const viewport: Viewport = {
  themeColor: '#0f0b14',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Layout racine provisoire (Phase 3). Le branding par marque (`GET /storefront/config`, T7.3),
 * la langue de l'utilisateur et la navigation basse (SCR-01) arrivent en P3.
 * Polices : auto-hébergées dans `public/fonts`, déclarées dans `globals.css`.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="preload"
          href="/fonts/figtree-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
