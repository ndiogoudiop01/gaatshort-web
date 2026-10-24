'use client';

import Link from 'next/link';

/** Erreur de rendu (API injoignable…) : jamais de détail technique affiché au visiteur. */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Oups, un souci de connexion</h1>
      <p className="text-muted">
        Le service ne répond pas pour le moment. Vérifiez votre connexion et réessayez.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-contrast"
      >
        Réessayer
      </button>
      <Link href="/" className="text-sm text-muted underline-offset-4 hover:underline">
        Accueil
      </Link>
    </main>
  );
}
