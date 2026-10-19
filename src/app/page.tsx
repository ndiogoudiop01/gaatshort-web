/**
 * Accueil provisoire (Phase 3) : il prouve la chaîne de rendu et le thème. Il sera remplacé par
 * SCR-01 (vitrine rendue côté serveur) en tâche T3.5.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <p className="font-display text-3xl font-extrabold tracking-tight">
        gaat<span className="text-accent">short</span>
      </p>
      <h1 className="font-display text-2xl font-bold leading-tight">
        Les mini-séries arrivent bientôt.
      </h1>
      <p className="text-muted">
        Les 5 premiers épisodes de chaque série seront gratuits. Paiement par Wave, Orange Money,
        Free Money ou carte.
      </p>
    </main>
  );
}
