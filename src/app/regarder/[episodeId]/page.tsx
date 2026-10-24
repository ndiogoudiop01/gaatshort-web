import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { watchData } from '@modules/viewer/data';
import { Player } from '@modules/viewer/components/player';
import { LockPanel } from '@modules/viewer/components/lock-panel';

export const metadata: Metadata = { title: 'Lecture', robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function WatchPage({ params }: { params: Promise<{ episodeId: string }> }) {
  const { episodeId } = await params;
  if (!UUID.test(episodeId)) notFound();
  const w = await watchData(`/regarder/${episodeId}`, episodeId);

  if (w.kind === 'missing') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-bold">Épisode indisponible</h1>
        <p className="text-muted">
          Cet épisode n’est pas encore prêt ou n’est pas disponible dans votre pays.
        </p>
        <Link
          href="/"
          className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-contrast"
        >
          Accueil
        </Link>
      </main>
    );
  }
  if (w.kind === 'locked') {
    return (
      <LockPanel
        key={episodeId}
        episodeId={episodeId}
        priceCoins={w.priceCoins}
        loginRequired={w.loginRequired}
        wallet={w.wallet}
      />
    );
  }
  return (
    <Player
      key={episodeId}
      playback={w.playback}
      title={w.series?.title ?? ''}
      signedIn={w.signedIn}
    />
  );
}
