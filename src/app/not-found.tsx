import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Page introuvable</h1>
      <p className="text-muted">
        Ce contenu n’existe pas, a été retiré ou n’est pas disponible dans votre pays.
      </p>
      <Link
        href="/"
        className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-contrast"
      >
        Retour à l’accueil
      </Link>
    </main>
  );
}
