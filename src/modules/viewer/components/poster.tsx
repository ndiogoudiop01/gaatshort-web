import Link from 'next/link';
import type { SeriesCard } from '../types';
import { plural } from '../format';

/** Affiche verticale (3:4) d'une série, lien vers sa fiche. */
export function Poster({
  series,
  priority = false,
  progress,
}: {
  series: SeriesCard;
  priority?: boolean;
  progress?: number;
}) {
  return (
    <Link href={`/serie/${series.slug}`} className="group block w-full" prefetch={false}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] bg-surface-2">
        {series.posterUrl ? (
          <img
            src={series.posterUrl}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-br from-accent/40 to-surface-2 p-3">
            <span className="font-display text-lg font-bold leading-tight">{series.title}</span>
          </div>
        )}
        {series.freeEpisodes > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-success">
            {series.freeEpisodes} gratuits
          </span>
        )}
        {progress !== undefined && (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
            <span
              className="block h-full bg-accent"
              style={{ width: `${Math.min(100, Math.max(4, progress * 100))}%` }}
            />
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{series.title}</p>
      <p className="text-xs text-muted">{plural(series.episodeCount, 'épisode')}</p>
    </Link>
  );
}

/** Rangée horizontale défilante (mobile) / grille (grand écran). */
export function Rail({
  title,
  items,
  href,
}: {
  title: string;
  items: SeriesCard[];
  href?: string;
}) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between px-4 md:px-0">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm text-muted hover:text-text">
            Tout voir
          </Link>
        )}
      </div>
      <ul className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:px-0">
        {items.map((s, i) => (
          <li key={s.id} className="w-[38%] shrink-0 snap-start sm:w-[26%] md:w-[18%] lg:w-[15%]">
            <Poster series={s} priority={i < 3} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PosterGrid({ items }: { items: SeriesCard[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((s, i) => (
        <li key={s.id}>
          <Poster series={s} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
