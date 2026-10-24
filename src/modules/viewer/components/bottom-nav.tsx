'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, Home, UserRound } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Accueil', Icon: Home, match: (p: string) => p === '/' },
  {
    href: '/decouvrir',
    label: 'Découvrir',
    Icon: Compass,
    match: (p: string) => p.startsWith('/decouvrir'),
  },
  {
    href: '/ma-liste',
    label: 'Ma liste',
    Icon: Heart,
    match: (p: string) => p.startsWith('/ma-liste'),
  },
  {
    href: '/profil',
    label: 'Profil',
    Icon: UserRound,
    match: (p: string) => p.startsWith('/profil') || p.startsWith('/boutique'),
  },
];

/** Navigation basse (mobile) ; masquée dans le lecteur, qui occupe tout l'écran. */
export function BottomNav() {
  const path = usePathname();
  if (path.startsWith('/regarder') || path.startsWith('/connexion')) return null;
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(path);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? 'text-accent' : 'text-muted'}`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** En-tête : logo + liens (grand écran). */
export function TopBar({ brand }: { brand: string }) {
  const path = usePathname();
  if (path.startsWith('/regarder')) return null;
  const isGaat = brand.toLowerCase() === 'gaatshort';
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-display text-xl font-extrabold tracking-tight"
          aria-label={`${brand} — accueil`}
        >
          {isGaat ? (
            <>
              gaat<span className="text-accent">short</span>
            </>
          ) : (
            brand
          )}
        </Link>
        <nav aria-label="Navigation" className="hidden items-center gap-6 text-sm md:flex">
          {TABS.map(({ href, label, match }) => (
            <Link
              key={href}
              href={href}
              className={match(path) ? 'text-text' : 'text-muted hover:text-text'}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/boutique"
            className="rounded-full bg-coin px-3 py-1 font-semibold text-black"
          >
            Crédits
          </Link>
        </nav>
        <Link href="/decouvrir" className="text-sm text-muted md:hidden" aria-label="Rechercher">
          <Compass size={22} aria-hidden />
        </Link>
      </div>
    </header>
  );
}
