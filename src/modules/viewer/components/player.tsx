'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, SkipForward } from 'lucide-react';
import { progressAction } from '../actions';
import type { Playback } from '../types';

const SAVE_EVERY_SECONDS = 10;

/**
 * Lecteur vertical HLS. hls.js (chargé à la demande) partout où MSE existe ; lecture native
 * (Safari iOS) sinon. La position est enregistrée toutes les 10 s, à la pause et à la fin.
 */
export function Player({
  playback,
  title,
  signedIn,
}: {
  playback: Playback;
  title: string;
  signedIn: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const next = playback.nextEpisodeId;

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    const seek = () => {
      if (playback.resumeAtSeconds > 0) el.currentTime = playback.resumeAtSeconds;
    };
    el.addEventListener('loadedmetadata', seek, { once: true });

    void import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 20, capLevelToPlayerSize: true });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setError('La vidéo ne peut pas être lue pour le moment. Réessayez.');
        });
        hls.loadSource(playback.hlsUrl);
        hls.attachMedia(el);
        destroy = () => hls.destroy();
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        el.src = playback.hlsUrl;
      } else {
        setError('Ce navigateur ne sait pas lire cette vidéo.');
      }
    });

    return () => {
      cancelled = true;
      el.removeEventListener('loadedmetadata', seek);
      destroy?.();
    };
  }, [playback.hlsUrl, playback.resumeAtSeconds]);

  // Fin d'épisode : enchaîne sur le suivant après un court délai (annulable en quittant).
  useEffect(() => {
    if (!ended || !next) return;
    const t = setTimeout(() => router.push(`/regarder/${next}`), 4000);
    return () => clearTimeout(t);
  }, [ended, next, router]);

  const save = (completed: boolean) => {
    const el = video.current;
    if (!signedIn || !el) return;
    lastSaved.current = el.currentTime;
    void progressAction(playback.episode.id, el.currentTime, completed);
  };

  return (
    <div className="relative mx-auto flex h-dvh max-w-[calc(100dvh*9/16)] items-center bg-black">
      <video
        ref={video}
        className="h-full w-full object-contain"
        controls
        autoPlay
        playsInline
        crossOrigin={playback.subtitles.length ? 'anonymous' : undefined}
        onTimeUpdate={(e) => {
          if (Math.abs(e.currentTarget.currentTime - lastSaved.current) >= SAVE_EVERY_SECONDS)
            save(false);
        }}
        onPause={() => save(false)}
        onPlay={() => setEnded(false)}
        onEnded={() => {
          save(true);
          setEnded(true);
        }}
      >
        {playback.subtitles.map((s, i) => (
          <track
            key={s.locale}
            kind="subtitles"
            src={s.url}
            srcLang={s.locale}
            label={s.locale.toUpperCase()}
            default={i === 0}
          />
        ))}
      </video>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/80 to-transparent p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href={`/serie/${playback.seriesSlug}`}
          className="pointer-events-auto rounded-full p-1.5 hover:bg-white/10"
          aria-label="Retour à la série"
        >
          <ChevronLeft size={26} aria-hidden />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs text-white/70">
            Épisode {playback.episode.number}
            {playback.episode.title && !/^épisode \d+$/i.test(playback.episode.title.trim())
              ? ` · ${playback.episode.title}`
              : ''}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-[var(--radius-card)] bg-surface-1 p-4 text-center text-sm"
        >
          {error}
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-3 block w-full rounded-full bg-accent py-2 font-semibold text-accent-contrast"
          >
            Réessayer
          </button>
        </div>
      )}

      {ended && (
        <div className="absolute inset-x-4 bottom-24 rounded-[var(--radius-card)] bg-surface-1/95 p-4 text-center">
          {next ? (
            <>
              <p className="text-sm text-muted">Épisode suivant dans quelques secondes…</p>
              <Link
                href={`/regarder/${next}`}
                className="mt-3 flex items-center justify-center gap-2 rounded-full bg-accent py-2.5 font-semibold text-accent-contrast"
              >
                <SkipForward size={18} aria-hidden /> Regarder maintenant
              </Link>
            </>
          ) : (
            <>
              <p className="font-semibold">Vous avez terminé la série.</p>
              <Link
                href="/decouvrir"
                className="mt-3 block rounded-full bg-accent py-2.5 font-semibold text-accent-contrast"
              >
                Découvrir d’autres séries
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
