import type { Metadata } from 'next';
import Link from 'next/link';
import { Coins } from 'lucide-react';
import { accountData } from '@modules/viewer/data';
import { formatCoins } from '@modules/viewer/format';
import { logoutAction } from '@modules/viewer/actions';
import { SubmitButton } from '@modules/viewer/components/submit-button';

export const metadata: Metadata = { title: 'Profil', robots: { index: false } };

export default async function ProfilePage() {
  const account = await accountData('/profil');
  if (!account) {
    return (
      <main className="mx-auto flex max-w-sm flex-col items-center gap-4 px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Votre compte</h1>
        <p className="text-muted">
          Connectez-vous pour débloquer des épisodes et reprendre vos séries.
        </p>
        <Link
          href="/connexion?next=/profil"
          className="w-full rounded-full bg-accent py-3 font-semibold text-accent-contrast"
        >
          Se connecter
        </Link>
      </main>
    );
  }
  const { wallet, phone } = account;
  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
      <h1 className="font-display text-2xl font-bold">Profil</h1>
      {phone && <p className="text-muted">Connecté avec le {phone}</p>}

      <section className="rounded-[var(--radius-sheet)] bg-surface-1 p-5">
        <p className="text-sm text-muted">Solde</p>
        <p className="mt-1 flex items-center gap-2 font-display text-3xl font-extrabold">
          <Coins className="text-coin" size={28} aria-hidden /> {formatCoins(wallet.total)}
          <span className="text-base font-medium text-muted">crédits</span>
        </p>
        {wallet.bonusBalance > 0 && (
          <p className="mt-1 text-sm text-muted">
            dont {formatCoins(wallet.bonusBalance)} offerts (utilisés en premier)
          </p>
        )}
        <Link
          href="/boutique"
          className="mt-4 block rounded-full bg-coin py-3 text-center font-semibold text-black"
        >
          Acheter des crédits
        </Link>
      </section>

      <form action={logoutAction}>
        <SubmitButton
          className="w-full rounded-full border border-border py-3 font-semibold"
          pendingLabel="Déconnexion…"
        >
          Se déconnecter
        </SubmitButton>
      </form>
    </main>
  );
}
