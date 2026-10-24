import type { Metadata } from 'next';
import { Coins } from 'lucide-react';
import { shopData } from '@modules/viewer/data';
import { buyAction } from '@modules/viewer/actions';
import { formatCoins } from '@modules/viewer/format';
import { formatMoney } from '@shared/utils/money';
import { SubmitButton } from '@modules/viewer/components/submit-button';

export const metadata: Metadata = { title: 'Crédits' };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const { packs, wallet, signedIn } = await shopData('/boutique');

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Acheter des crédits</h1>
        <p className="mt-1 text-sm text-muted">
          Paiement par Wave, Orange Money, Free Money ou carte bancaire.
        </p>
      </div>
      {wallet && (
        <p className="flex items-center gap-2 rounded-[var(--radius-card)] bg-surface-1 px-4 py-3 text-sm">
          <Coins size={18} className="text-coin" aria-hidden /> Solde actuel :{' '}
          <strong>{formatCoins(wallet.total)} crédits</strong>
        </p>
      )}
      {erreur && (
        <p
          role="alert"
          className="rounded-[var(--radius-card)] bg-danger/15 px-4 py-3 text-sm text-danger"
        >
          {erreur.slice(0, 160)}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {packs.map((p) => (
          <li key={p.id}>
            <form
              action={buyAction}
              className={`relative flex items-center justify-between gap-4 rounded-[var(--radius-sheet)] border bg-surface-1 p-4 ${p.badge ? 'border-coin' : 'border-border'}`}
            >
              <input type="hidden" name="packId" value={p.id} />
              {p.badge && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-coin px-2 py-0.5 text-[11px] font-bold text-black">
                  {p.badge}
                </span>
              )}
              <div>
                <p className="flex items-center gap-1.5 font-display text-xl font-extrabold">
                  <Coins size={20} className="text-coin" aria-hidden /> {formatCoins(p.coins)}
                </p>
                {p.bonusCoins > 0 && (
                  <p className="text-sm text-success">+ {formatCoins(p.bonusCoins)} offerts</p>
                )}
              </div>
              <SubmitButton
                className="rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-contrast"
                pendingLabel="…"
              >
                {formatMoney(p.amountMinor, p.currencyCode)}
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
      {!signedIn && (
        <p className="text-center text-sm text-muted">
          Vous serez invité à vous connecter avant le paiement.
        </p>
      )}
      <p className="text-xs text-muted">
        Les crédits servent à débloquer des épisodes ; un épisode débloqué le reste. Les crédits
        offerts sont utilisés en premier.
      </p>
    </main>
  );
}
