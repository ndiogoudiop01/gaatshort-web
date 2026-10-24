'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus } from 'lucide-react';
import { toggleFavoriteAction } from '../actions';

export function FavoriteButton({
  seriesId,
  slug,
  initial,
}: {
  seriesId: string;
  slug: string;
  initial: boolean;
}) {
  const [isFavorite, setFavorite] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={isFavorite}
      onClick={() =>
        start(async () => {
          const r = await toggleFavoriteAction(seriesId, slug, isFavorite).catch(() => null);
          if (!r) return;
          if ('login' in r) router.push(`/connexion?next=/serie/${slug}`);
          else setFavorite(r.isFavorite);
        })
      }
      className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 disabled:opacity-60"
    >
      {isFavorite ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
      {isFavorite ? 'Dans ma liste' : 'Ma liste'}
    </button>
  );
}
