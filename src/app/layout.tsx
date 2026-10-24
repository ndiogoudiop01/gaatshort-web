import type { Metadata, Viewport } from 'next';
import '@shared/styles/globals.css';
import { storefrontConfig } from '@modules/viewer/data';
import { safeHexColor } from '@modules/viewer/format';
import { BottomNav, TopBar } from '@modules/viewer/components/bottom-nav';
import type { StorefrontConfig } from '@modules/viewer/types';

const FALLBACK: StorefrontConfig = {
  name: 'Gaatshort',
  slug: 'gaatshort',
  branding: {},
  defaultLocale: 'fr',
  currency: 'XOF',
  accountNotice: null,
};

/** La marque vient de l'hôte (résolue par l'API) : nom, couleur d'accent. Repli neutre si l'API ne répond pas. */
async function brand(): Promise<StorefrontConfig> {
  return storefrontConfig().catch(() => FALLBACK);
}

export async function generateMetadata(): Promise<Metadata> {
  const b = await brand();
  return {
    title: { default: `${b.name} — mini-séries`, template: `%s · ${b.name}` },
    description:
      'Mini-séries dramatiques à regarder sur mobile. Les premiers épisodes sont gratuits.',
    applicationName: b.name,
    appleWebApp: { capable: true, title: b.name, statusBarStyle: 'black-translucent' },
  };
}

export const viewport: Viewport = {
  themeColor: '#0f0b14',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const b = await brand();
  const accent = safeHexColor(b.branding.accent ?? b.branding.primaryColor);
  return (
    <html lang="fr" style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}>
      <head>
        <link
          rel="preload"
          href="/fonts/figtree-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <TopBar brand={b.name} />
        <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-10">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
