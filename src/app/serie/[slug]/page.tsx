import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Lock, Play } from 'lucide-react';
import { isMissing, seriesDetail, seriesForMetadata } from '@modules/viewer/data';
import { formatCoins, formatDuration, plural } from '@modules/viewer/format';
import { FavoriteButton } from '@modules/viewer/components/favorite-button';

type Props = { params: Promise<{ slug: string }> };

/** SEO : titre, résumé et affiche pour les aperçus partagés (WhatsApp, Facebook). */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await seriesForMetadata(slug);
  if (!s) return { title: 'Série introuvable' };
  const image = s.bannerUrl ?? s.posterUrl;
  return {
    title: s.title,
    description: s.synopsis.slice(0, 160),
    alternates: { canonical: `/serie/${s.slug}` },
    openGraph: {
      type: 'video.tv_show',
      title: s.title,
      description: s.synopsis.slice(0, 200),
      images: image ? [image] : undefined,
    },
    twitter: { card: 'summary_large_image', title: s.title, images: image ? [image] : undefined },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  let data;
  try {
    data = await seriesDetail(`/serie/${slug}`, slug);
  } catch (e) {
    if (isMissing(e)) notFound();
    throw e;
  }
  const { series: s } = data;
  const first = s.episodes[0];
  const resumeEp =
    s.resume && !s.resume.completed
      ? s.episodes.find((e) => e.id === s.resume?.episodeId)
      : undefined;
  const cta = resumeEp ?? first;

  return (
    <main className="mx-auto max-w-6xl md:px-4">
      <section className="relative">
        <div
          className={`w-full ${(s.bannerUrl ?? s.posterUrl) ? 'aspect-[4/5] sm:aspect-[16/9]' : 'aspect-[16/9] bg-gradient-to-br from-accent/45 via-surface-2 to-bg'} md:aspect-[21/9] md:mt-6 md:overflow-hidden md:rounded-[var(--radius-sheet)]`}
        >
          {(s.bannerUrl ?? s.posterUrl) && (
            <img
              src={s.bannerUrl ?? s.posterUrl ?? ''}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent md:rounded-[var(--radius-sheet)]" />
      </section>

      <section className="relative -mt-28 flex flex-col gap-3 px-4 md:-mt-36 md:max-w-2xl md:px-8">
        <h1 className="font-display text-3xl font-extrabold leading-tight">{s.title}</h1>
        <p className="flex flex-wrap gap-x-2 text-sm text-muted">
          {s.releaseYear && <span>{s.releaseYear}</span>}
          <span>{plural(s.episodeCount, 'épisode')}</span>
          <span className="rounded border border-border px-1.5 text-xs leading-5">
            {s.maturityRating}
          </span>
          {s.genres.map((g) => (
            <Link key={g.id} href={`/decouvrir?genre=${g.slug}`} className="hover:text-text">
              {g.name}
            </Link>
          ))}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {cta && (
            <Link
              href={`/regarder/${cta.id}`}
              className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-contrast"
            >
              <Play size={18} fill="currentColor" aria-hidden />
              {resumeEp ? `Reprendre l’épisode ${resumeEp.number}` : 'Regarder l’épisode 1'}
            </Link>
          )}
          <FavoriteButton seriesId={s.id} slug={s.slug} initial={s.isFavorite} />
        </div>
        <p className="text-sm leading-relaxed text-text/85">{s.synopsis}</p>
        {s.freeEpisodes > 0 && (
          <p className="text-sm text-success">
            Les {s.freeEpisodes} premiers épisodes sont gratuits.
          </p>
        )}
      </section>

      <section className="mt-8 px-4 md:px-8">
        <h2 className="mb-3 font-display text-lg font-bold">Épisodes</h2>
        <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
          {s.episodes.map((e) => {
            const locked = !e.isFree && !e.unlocked;
            return (
              <li key={e.id}>
                <Link
                  href={`/regarder/${e.id}`}
                  title={`${e.title}${e.durationSeconds ? ` · ${formatDuration(e.durationSeconds)}` : ''}${locked ? ` · ${formatCoins(e.priceCoins)} crédits` : ''}`}
                  aria-label={`Épisode ${e.number}${locked ? ', verrouillé' : ''}${e.completed ? ', vu' : ''}`}
                  className={`relative flex aspect-square items-center justify-center rounded-[var(--radius-card)] text-base font-semibold ${
                    e.id === resumeEp?.id
                      ? 'bg-accent text-accent-contrast'
                      : 'bg-surface-1 hover:bg-surface-2'
                  } ${e.completed ? 'text-muted' : ''}`}
                >
                  {e.number}
                  {locked && (
                    <Lock size={12} className="absolute right-1.5 top-1.5 text-coin" aria-hidden />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
