'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { orderStatusAction } from '../actions';
import { formatCoins } from '../format';
import type { Order } from '../types';

const POLL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes : au-delà, la notification de paiement arrivera plus tard.

/**
 * Retour de paiement. La commande n'est réglée que sur notification VÉRIFIÉE du prestataire,
 * jamais sur ce retour de navigateur : on interroge l'état tant qu'il est « en attente ».
 */
export function OrderStatus({ initial }: { initial: Order }) {
  const [order, setOrder] = useState(initial);
  const [polls, setPolls] = useState(0);
  const waiting = order.status === 'PENDING' && polls < MAX_POLLS;

  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(async () => {
      const next = await orderStatusAction(order.reference).catch(() => null);
      if (next) setOrder(next);
      setPolls((n) => n + 1);
    }, POLL_MS);
    return () => clearTimeout(t);
  }, [waiting, polls, order.reference]);

  const total = order.coins + order.bonusCoins;
  if (order.status === 'SUCCEEDED') {
    return (
      <Panel
        icon={<CheckCircle2 size={44} className="text-success" aria-hidden />}
        title="Paiement confirmé"
      >
        <p className="text-muted">{formatCoins(total)} crédits ont été ajoutés à votre compte.</p>
        <Link
          href="/"
          className="w-full rounded-full bg-accent py-3 font-semibold text-accent-contrast"
        >
          Continuer à regarder
        </Link>
      </Panel>
    );
  }
  if (order.status === 'PENDING') {
    return (
      <Panel
        icon={<Clock size={44} className="text-warning" aria-hidden />}
        title="Paiement en cours de confirmation"
      >
        <p className="text-muted" aria-live="polite">
          {waiting
            ? 'Nous attendons la confirmation de l’opérateur…'
            : 'La confirmation prend plus de temps que prévu. Vos crédits seront ajoutés dès sa réception.'}
        </p>
        <p className="text-xs text-muted">Référence : {order.reference}</p>
        <Link
          href="/profil"
          className="w-full rounded-full border border-border py-3 font-semibold"
        >
          Voir mon solde
        </Link>
      </Panel>
    );
  }
  return (
    <Panel
      icon={<XCircle size={44} className="text-danger" aria-hidden />}
      title="Paiement non abouti"
    >
      <p className="text-muted">
        Aucun montant n’a été débité pour cette commande. Vous pouvez réessayer.
      </p>
      <Link
        href="/boutique"
        className="w-full rounded-full bg-accent py-3 font-semibold text-accent-contrast"
      >
        Retour à la boutique
      </Link>
    </Panel>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      {icon}
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
