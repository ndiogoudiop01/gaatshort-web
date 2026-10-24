export default function Loading() {
  return (
    <div
      className="mx-auto max-w-6xl animate-pulse px-4 py-6"
      aria-busy="true"
      aria-label="Chargement"
    >
      <div className="aspect-[4/5] rounded-[var(--radius-sheet)] bg-surface-1 sm:aspect-[21/9]" />
      <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-[var(--radius-card)] bg-surface-1" />
        ))}
      </div>
    </div>
  );
}
