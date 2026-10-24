import 'server-only';
import { cache } from 'react';
import { ApiError } from '@core/http/api-error';
import { pageAccessToken, readSession, viewerRequest } from '@core/session/session';
import type {
  ContinueItem,
  Home,
  Order,
  Pack,
  Playback,
  SeriesCard,
  SeriesDetail,
  StorefrontConfig,
  Wallet,
} from './types';

/**
 * Lectures des PAGES (Server Components). `path` sert au retour après renouvellement de
 * session. Rendu dynamique : la marque et le spectateur changent d'une requête à l'autre.
 */
/** Une seule lecture par requête (layout, métadonnées et page la partagent). */
export const storefrontConfig = cache(async (): Promise<StorefrontConfig> => {
  return (await viewerRequest<StorefrontConfig>(null, { path: 'storefront/config' })).data;
});

export async function homeData(path: string) {
  const token = await pageAccessToken(path);
  const [home, resume] = await Promise.all([
    viewerRequest<Home>(token, { path: 'storefront/home', query: { locale: 'fr' } }).then(
      (r) => r.data,
    ),
    token
      ? viewerRequest<ContinueItem[]>(token, {
          path: 'me/continue-watching',
          query: { locale: 'fr' },
        })
          .then((r) => r.data)
          .catch(() => [])
      : Promise.resolve([] as ContinueItem[]),
  ]);
  return { home, resume, signedIn: !!token };
}

export async function searchSeries(path: string, q: { q?: string; genre?: string; page?: number }) {
  const token = await pageAccessToken(path);
  const [list, genres] = await Promise.all([
    viewerRequest<SeriesCard[]>(token, {
      path: 'storefront/series',
      query: { ...q, locale: 'fr', perPage: 24 },
    }),
    viewerRequest<{ id: string; slug: string; name: string }[]>(null, {
      path: 'storefront/genres',
      query: { locale: 'fr' },
    }),
  ]);
  return { items: list.data, meta: list.meta, genres: genres.data };
}

export async function seriesDetail(path: string, slug: string) {
  const token = await pageAccessToken(path);
  const series = (
    await viewerRequest<SeriesDetail>(token, {
      path: `storefront/series/${encodeURIComponent(slug)}`,
      query: { locale: 'fr' },
    })
  ).data;
  return { series, signedIn: !!token };
}

/** Pour les métadonnées (SEO) : jamais de session, jamais de redirection. */
export async function seriesForMetadata(slug: string): Promise<SeriesDetail | null> {
  try {
    return (
      await viewerRequest<SeriesDetail>(null, {
        path: `storefront/series/${encodeURIComponent(slug)}`,
        query: { locale: 'fr' },
      })
    ).data;
  } catch {
    return null;
  }
}

export async function accountData(path: string) {
  const token = await pageAccessToken(path);
  if (!token) return null;
  const [wallet, session] = await Promise.all([
    viewerRequest<Wallet>(token, { path: 'wallet' }).then((r) => r.data),
    readSession(),
  ]);
  return { wallet, phone: session.phone };
}

export async function favoritesData(path: string) {
  const token = await pageAccessToken(path);
  if (!token) return null;
  return (
    await viewerRequest<SeriesCard[]>(token, { path: 'me/favorites', query: { locale: 'fr' } })
  ).data;
}

export async function shopData(path: string) {
  const token = await pageAccessToken(path);
  const [packs, wallet] = await Promise.all([
    viewerRequest<Pack[]>(null, { path: 'billing/packs' }).then((r) => r.data),
    token
      ? viewerRequest<Wallet>(token, { path: 'wallet' })
          .then((r) => r.data)
          .catch(() => null)
      : Promise.resolve(null),
  ]);
  return { packs, wallet, signedIn: !!token };
}

export async function orderData(path: string, reference: string) {
  const token = await pageAccessToken(path);
  if (!token) return null;
  return (
    await viewerRequest<Order>(token, { path: `billing/orders/${encodeURIComponent(reference)}` })
  ).data;
}

export type WatchData =
  | { kind: 'ok'; playback: Playback; series: SeriesDetail | null; signedIn: boolean }
  | {
      kind: 'locked';
      priceCoins: number;
      loginRequired: boolean;
      wallet: Wallet | null;
      signedIn: boolean;
    }
  | { kind: 'missing' };

/** Lecteur : URL signée, ou verrou (prix, connexion requise) quand l'épisode est payant. */
export async function watchData(path: string, episodeId: string): Promise<WatchData> {
  const token = await pageAccessToken(path);
  try {
    const playback = (
      await viewerRequest<Playback>(token, {
        path: `episodes/${encodeURIComponent(episodeId)}/playback`,
        query: { locale: 'fr' },
      })
    ).data;
    const series = await viewerRequest<SeriesDetail>(token, {
      path: `storefront/series/${encodeURIComponent(playback.seriesSlug)}`,
      query: { locale: 'fr' },
    })
      .then((r) => r.data)
      .catch(() => null);
    return { kind: 'ok', playback, series, signedIn: !!token };
  } catch (e) {
    if (e instanceof ApiError && e.code === 'EPISODE_LOCKED') {
      const wallet = token
        ? await viewerRequest<Wallet>(token, { path: 'wallet' })
            .then((r) => r.data)
            .catch(() => null)
        : null;
      return {
        kind: 'locked',
        priceCoins: Number(e.details?.priceCoins ?? 0),
        loginRequired: Boolean(e.details?.loginRequired),
        wallet,
        signedIn: !!token,
      };
    }
    if (e instanceof ApiError && (e.isNotFound || e.status === 400)) return { kind: 'missing' };
    throw e;
  }
}

/** Fiche introuvable (autre pays, retirée, slug inconnu) → 404 de la page. */
export function isMissing(e: unknown): boolean {
  return e instanceof ApiError && e.isNotFound;
}
