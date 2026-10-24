import type { Metadata } from 'next';
import Link from 'next/link';
import { favoritesData } from '@modules/viewer/data';
import { PosterGrid } from '@modules/viewer/components/poster';

export const metadata: Metadata = { title: 'Ma liste', robots: { index: false } };

export default async function MyListPage() {
  const items = await favoritesData('/ma-liste');
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-5 font-display text-2xl font-bold">Ma liste</h1>
      {items === null ? (
        <Empty
          text="Connectez-vous pour retrouver vos séries sur tous vos appareils."
          href="/connexion?next=/ma-liste"
          cta="Se connecter"
        />
      ) : items.length ? (
        <PosterGrid items={items} />
      ) : (
        <Empty
          text="Ajoutez des séries à votre liste depuis leur fiche."
          href="/decouvrir"
          cta="Découvrir des séries"
        />
      )}
    </main>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="max-w-xs text-muted">{text}</p>
      <Link
        href={href}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-contrast"
      >
        {cta}
      </Link>
    </div>
  );
}
