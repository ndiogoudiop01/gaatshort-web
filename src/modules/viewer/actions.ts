'use server';

import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApiError } from '@core/http/api-error';
import {
  actionAccessToken,
  clearSession,
  viewerRequest,
  writeSession,
  type TokenPair,
} from '@core/session/session';
import { safeNext } from '@core/session/jwt';
import { toE164 } from '@shared/utils/phone';
import { messageFor } from './messages';
import type { Order, PlaybackResult, Playback, Wallet } from './types';

/* ─────────────────────────── Connexion par code SMS ─────────────────────────── */

export interface OtpState {
  step: 'phone' | 'code';
  phone?: string;
  error?: string;
  next: string;
}

async function requestOtpAction(_prev: OtpState, form: FormData): Promise<OtpState> {
  const next = safeNext(String(form.get('next') ?? '/'));
  const dial = form.get('dial') === '+220' ? '+220' : '+221';
  const phone = toE164(String(form.get('phone') ?? ''), dial);
  if (!phone || !(phone.startsWith('+221') || phone.startsWith('+220'))) {
    return {
      step: 'phone',
      error: 'Numéro invalide : un numéro du Sénégal ou de Gambie est attendu.',
      next,
    };
  }
  try {
    await viewerRequest(null, {
      path: 'auth/challenge',
      method: 'POST',
      body: { channel: 'PHONE_OTP', identifier: phone },
    });
    return { step: 'code', phone, next };
  } catch (e) {
    return { step: 'phone', error: messageFor(e), next };
  }
}

async function verifyOtpAction(prev: OtpState, form: FormData): Promise<OtpState> {
  const code = String(form.get('code') ?? '').replace(/\D/g, '');
  if (!prev.phone || code.length < 6) return { ...prev, error: 'Saisissez le code à 6 chiffres.' };
  try {
    const { data } = await viewerRequest<TokenPair>(null, {
      path: 'auth/verify',
      method: 'POST',
      body: { identifier: prev.phone, secret: code },
    });
    await writeSession(data, prev.phone);
  } catch (e) {
    return { ...prev, error: messageFor(e) };
  }
  redirect(prev.next);
}

/** Point d'entrée unique du formulaire (useActionState) : l'étape courante décide. */
export async function otpAction(prev: OtpState, form: FormData): Promise<OtpState> {
  const intent = String(form.get('intent') ?? '');
  if (intent === 'change') return { step: 'phone', next: prev.next };
  if (intent === 'resend' && prev.phone) {
    try {
      await viewerRequest(null, {
        path: 'auth/challenge',
        method: 'POST',
        body: { channel: 'PHONE_OTP', identifier: prev.phone },
      });
      return { ...prev, error: undefined };
    } catch (e) {
      return { ...prev, error: messageFor(e) };
    }
  }
  return prev.step === 'code' ? verifyOtpAction(prev, form) : requestOtpAction(prev, form);
}

export async function logoutAction(): Promise<void> {
  const token = await actionAccessToken();
  if (token)
    await viewerRequest(token, { path: 'auth/logout', method: 'POST' }).catch(() => undefined);
  await clearSession();
  redirect('/');
}

/* ─────────────────────────── Lecture ─────────────────────────── */

export async function playbackAction(episodeId: string): Promise<PlaybackResult> {
  const token = await actionAccessToken();
  try {
    const { data } = await viewerRequest<Playback>(token, {
      path: `episodes/${encodeURIComponent(episodeId)}/playback`,
      query: { locale: 'fr' },
    });
    return { kind: 'ok', playback: data };
  } catch (e) {
    if (e instanceof ApiError && e.code === 'EPISODE_LOCKED') {
      return {
        kind: 'locked',
        priceCoins: Number(e.details?.priceCoins ?? 0),
        loginRequired: Boolean(e.details?.loginRequired),
      };
    }
    return { kind: 'error', message: messageFor(e) };
  }
}

export type UnlockResult =
  | { ok: true; balance: Wallet }
  | { ok: false; reason: 'login' | 'balance' | 'error'; message: string };

export async function unlockAction(episodeId: string): Promise<UnlockResult> {
  const token = await actionAccessToken();
  if (!token) return { ok: false, reason: 'login', message: 'Connectez-vous pour débloquer.' };
  try {
    const { data } = await viewerRequest<{ balance: Wallet }>(token, {
      path: `episodes/${encodeURIComponent(episodeId)}/unlock`,
      method: 'POST',
    });
    return { ok: true, balance: data.balance };
  } catch (e) {
    if (e instanceof ApiError && e.code === 'INSUFFICIENT_BALANCE')
      return { ok: false, reason: 'balance', message: messageFor(e) };
    return { ok: false, reason: 'error', message: messageFor(e) };
  }
}

export async function progressAction(
  episodeId: string,
  positionSeconds: number,
  completed: boolean,
): Promise<void> {
  const token = await actionAccessToken();
  if (!token) return;
  await viewerRequest(token, {
    path: `episodes/${encodeURIComponent(episodeId)}/progress`,
    method: 'PUT',
    body: { positionSeconds: Math.max(0, Math.floor(positionSeconds)), completed },
  }).catch(() => undefined);
}

export async function walletAction(): Promise<Wallet | null> {
  const token = await actionAccessToken();
  if (!token) return null;
  return viewerRequest<Wallet>(token, { path: 'wallet' })
    .then((r) => r.data)
    .catch(() => null);
}

/* ─────────────────────────── Ma liste ─────────────────────────── */

export async function toggleFavoriteAction(
  seriesId: string,
  slug: string,
  isFavorite: boolean,
): Promise<{ isFavorite: boolean } | { login: true }> {
  const token = await actionAccessToken();
  if (!token) return { login: true };
  const r = isFavorite
    ? await viewerRequest<{ isFavorite: boolean }>(token, {
        path: `me/favorites/${encodeURIComponent(seriesId)}`,
        method: 'DELETE',
      })
    : await viewerRequest<{ isFavorite: boolean }>(token, {
        path: `me/favorites/${encodeURIComponent(slug)}`,
        method: 'POST',
      });
  revalidatePath('/ma-liste');
  return r.data;
}

/* ─────────────────────────── Boutique ─────────────────────────── */

export async function buyAction(form: FormData): Promise<void> {
  const packId = String(form.get('packId') ?? '');
  const token = await actionAccessToken();
  if (!token) redirect('/connexion?next=/boutique');
  const host = (await headers()).get('host') ?? '';
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  let order: Order;
  try {
    order = (
      await viewerRequest<Order>(token, {
        path: 'billing/orders',
        method: 'POST',
        body: { packId, returnUrl: `${proto}://${host}/boutique/retour` },
        // Une clé par clic : le formulaire est neutralisé pendant l'envoi (double clic).
        idempotencyKey: `web-${randomUUID()}`,
      })
    ).data;
  } catch (e) {
    redirect(`/boutique?erreur=${encodeURIComponent(messageFor(e))}`);
  }
  redirect(order.redirectUrl ?? `/boutique/retour?reference=${order.reference}`);
}

export async function orderStatusAction(reference: string): Promise<Order | null> {
  const token = await actionAccessToken();
  if (!token) return null;
  return viewerRequest<Order>(token, { path: `billing/orders/${encodeURIComponent(reference)}` })
    .then((r) => r.data)
    .catch(() => null);
}
