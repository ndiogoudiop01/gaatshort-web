import Link from 'next/link';
import { Play } from 'lucide-react';
import { homeData } from '@modules/viewer/data';
import { Poster, Rail } from '@modules/viewer/components/poster';

export default async function HomePage() {
  const { home, resume } = await homeData('/');
  const hero = home.featured[0];

  return (
    <main className="mx-auto max-w-6xl md:px-4">
      {hero && (
        <section className="relative overflow-hidden md:mt-6 md:rounded-[var(--radius-sheet)]">
          <div
            className={`w-full ${(hero.bannerUrl ?? hero.posterUrl) ? 'aspect-[4/5] sm:aspect-[16/9]' : 'aspect-[16/9] bg-gradient-to-br from-accent/45 via-surface-2 to-bg'} md:aspect-[21/9]`}
          >
            {(hero.bannerUrl ?? hero.posterUrl) && (
              <img
                src={hero.bannerUrl ?? hero.posterUrl ?? ''}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 md:max-w-xl md:p-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              À la une
            </span>
            <h1 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
              {hero.title}
            </h1>
            <p className="line-clamp-2 text-sm text-text/80">{hero.synopsis}</p>
            <Link
              href={`/serie/${hero.slug}`}
              className="flex w-fit items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-contrast"
            >
              <Play size={18} fill="currentColor" aria-hidden /> Regarder gratuitement
            </Link>
          </div>
        </section>
      )}

      <p className="mx-4 mt-5 rounded-[var(--radius-card)] bg-surface-1 px-4 py-3 text-sm text-muted md:mx-0">
        {home.freeEpisodesNotice}
      </p>

      {resume.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 px-4 font-display text-lg font-bold md:px-0">Reprendre</h2>
          <ul className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:px-0">
            {resume.map((r) => (
              <li key={r.series.id} className="w-[38%] shrink-0 sm:w-[26%] md:w-[18%] lg:w-[15%]">
                <Poster series={r.series} progress={r.completed ? 1 : 0.5} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {home.rows.map((row) => (
        <Rail key={row.key} title={row.title} items={row.items} href="/decouvrir" />
      ))}

      {home.genres.length > 0 && (
        <section className="mt-8 px-4 md:px-0">
          <h2 className="mb-3 font-display text-lg font-bold">Genres</h2>
          <ul className="flex flex-wrap gap-2">
            {home.genres.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/decouvrir?genre=${g.slug}`}
                  className="block rounded-full border border-border px-4 py-2 text-sm hover:bg-surface-2"
                >
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hero && home.rows.every((r) => !r.items.length) && (
        <p className="px-4 py-24 text-center text-muted">
          Les premières séries arrivent très bientôt.
        </p>
      )}
    </main>
  );
}
