import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { searchSeries } from '@modules/viewer/data';
import { PosterGrid } from '@modules/viewer/components/poster';

export const metadata: Metadata = { title: 'Découvrir' };

type Params = { q?: string; genre?: string; page?: string };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 80) || undefined;
  const genre = sp.genre || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const qs = new URLSearchParams(
    Object.entries({ q, genre, page: page > 1 ? String(page) : undefined }).filter(
      (e): e is [string, string] => !!e[1],
    ),
  );
  const { items, meta, genres } = await searchSeries(`/decouvrir${qs.size ? `?${qs}` : ''}`, {
    q,
    genre,
    page,
  });
  const link = (over: Partial<Record<keyof Params, string | undefined>>) => {
    const p = new URLSearchParams(
      Object.entries({ q, genre, ...over }).filter((e): e is [string, string] => !!e[1]),
    );
    return `/decouvrir${p.size ? `?${p}` : ''}`;
  };
  const totalPages = meta && 'totalPages' in meta ? meta.totalPages : 1;

  return (
    <main className="mx-auto max-w-6xl px-4 py-5">
      <h1 className="sr-only">Découvrir</h1>
      <form role="search" action="/decouvrir" className="relative">
        {genre && <input type="hidden" name="genre" value={genre} />}
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Titre, thème…"
          aria-label="Rechercher une série"
          className="w-full rounded-full border border-border bg-surface-1 py-3 pl-11 pr-4 outline-none focus:border-accent"
        />
      </form>

      <ul className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <li>
          <Link href={link({ genre: undefined, page: undefined })} className={chip(!genre)}>
            Tout
          </Link>
        </li>
        {genres.map((g) => (
          <li key={g.id}>
            <Link
              href={link({ genre: g.slug, page: undefined })}
              className={chip(genre === g.slug)}
              aria-current={genre === g.slug ? 'true' : undefined}
            >
              {g.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {items.length ? (
          <PosterGrid items={items} />
        ) : (
          <p className="py-20 text-center text-muted">
            Aucune série ne correspond à votre recherche.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-center gap-4 text-sm"
        >
          {page > 1 && (
            <Link
              href={link({ page: String(page - 1) })}
              className="rounded-full border border-border px-4 py-2"
            >
              Précédent
            </Link>
          )}
          <span className="text-muted">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={link({ page: String(page + 1) })}
              className="rounded-full border border-border px-4 py-2"
            >
              Suivant
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}

const chip = (active: boolean) =>
  `block whitespace-nowrap rounded-full px-4 py-2 text-sm ${active ? 'bg-text font-semibold text-bg' : 'border border-border text-muted hover:text-text'}`;
