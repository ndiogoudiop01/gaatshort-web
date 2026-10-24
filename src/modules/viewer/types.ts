export interface Genre {
  id: string;
  slug: string;
  name: string;
}

export interface SeriesCard {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  posterUrl: string | null;
  bannerUrl: string | null;
  maturityRating: string;
  releaseYear: number | null;
  tags: string[];
  genres: Genre[];
  episodeCount: number;
  freeEpisodes: number;
  featured: boolean;
}

export interface EpisodeItem {
  id: string;
  number: number;
  title: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  isFree: boolean;
  priceCoins: number;
  unlocked: boolean;
  progressSeconds?: number;
  completed?: boolean;
}

export interface SeriesDetail extends SeriesCard {
  episodes: EpisodeItem[];
  isFavorite: boolean;
  resume: { episodeId: string; positionSeconds: number; completed: boolean } | null;
}

export interface Home {
  featured: SeriesCard[];
  rows: { key: string; title: string; items: SeriesCard[] }[];
  genres: Genre[];
  freeEpisodesNotice: string;
}

export interface StorefrontConfig {
  name: string;
  slug: string;
  branding: { accent?: string; primaryColor?: string; logoUrl?: string | null };
  defaultLocale: string;
  currency: string;
  accountNotice: string | null;
}

export interface Playback {
  episode: {
    id: string;
    number: number;
    title: string;
    durationSeconds: number | null;
    isFree: boolean;
    priceCoins: number;
  };
  seriesId: string;
  seriesSlug: string;
  hlsUrl: string;
  expiresAt: string;
  subtitles: { locale: string; url: string }[];
  nextEpisodeId: string | null;
  resumeAtSeconds: number;
}

export interface Wallet {
  paidBalance: number;
  bonusBalance: number;
  total: number;
}

export interface Pack {
  id: string;
  code: string;
  coins: number;
  bonusCoins: number;
  currencyCode: string;
  amountMinor: number;
  badge: string | null;
}

export interface Order {
  id: string;
  reference: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  coins: number;
  bonusCoins: number;
  currencyCode: string;
  amountMinor: number;
  redirectUrl: string | null;
}

export interface ContinueItem {
  series: SeriesCard;
  episodeId: string;
  positionSeconds: number;
  completed: boolean;
}

/** Résultat d'une demande de lecture, sans exception à gérer côté client. */
export type PlaybackResult =
  | { kind: 'ok'; playback: Playback }
  | { kind: 'locked'; priceCoins: number; loginRequired: boolean }
  | { kind: 'error'; message: string };
