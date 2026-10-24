'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coins, Lock } from 'lucide-react';
import { unlockAction } from '../actions';
import { formatCoins } from '../format';
import type { Wallet } from '../types';

/** Épisode payant non débloqué : connexion, déblocage par crédits ou achat de crédits. */
export function LockPanel({
  episodeId,
  priceCoins,
  loginRequired,
  wallet,
}: {
  episodeId: string;
  priceCoins: number;
  loginRequired: boolean;
  wallet: Wallet | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [needCoins, setNeedCoins] = useState(!!wallet && wallet.total < priceCoins);
  const here = `/regarder/${episodeId}`;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-surface-2">
        <Lock size={28} aria-hidden />
      </span>
      <h1 className="font-display text-2xl font-bold">Épisode verrouillé</h1>
      <p className="text-muted">
        Débloquez-le pour <strong className="text-coin">{formatCoins(priceCoins)} crédits</strong>.
        Il reste à vous, sans limite de durée.
      </p>

      {loginRequired ? (
        <Link
          href={`/connexion?next=${encodeURIComponent(here)}`}
          className="w-full rounded-full bg-accent py-3 font-semibold text-accent-contrast"
        >
          Se connecter pour débloquer
        </Link>
      ) : (
        <>
          {wallet && (
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Coins size={16} className="text-coin" aria-hidden /> Solde :{' '}
              {formatCoins(wallet.total)} crédits
            </p>
          )}
          {needCoins ? (
            <Link
              href="/boutique"
              className="w-full rounded-full bg-coin py-3 font-semibold text-black"
            >
              Acheter des crédits
            </Link>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const r = await unlockAction(episodeId);
                  if (r.ok) router.refresh();
                  else if (r.reason === 'login')
                    router.push(`/connexion?next=${encodeURIComponent(here)}`);
                  else {
                    setError(r.message);
                    if (r.reason === 'balance') setNeedCoins(true);
                  }
                })
              }
              className="w-full rounded-full bg-accent py-3 font-semibold text-accent-contrast disabled:opacity-60"
            >
              {pending ? 'Déblocage…' : `Débloquer pour ${formatCoins(priceCoins)} crédits`}
            </button>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-muted underline-offset-4 hover:underline"
      >
        Retour
      </button>
    </div>
  );
}
