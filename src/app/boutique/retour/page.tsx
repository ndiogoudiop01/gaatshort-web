import type { Metadata } from 'next';
import Link from 'next/link';
import { orderData } from '@modules/viewer/data';
import { OrderStatus } from '@modules/viewer/components/order-status';

export const metadata: Metadata = { title: 'Paiement', robots: { index: false } };

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; ref_command?: string }>;
}) {
  const sp = await searchParams;
  const reference = (sp.reference ?? sp.ref_command ?? '').slice(0, 64);
  const order = reference
    ? await orderData(
        `/boutique/retour?reference=${encodeURIComponent(reference)}`,
        reference,
      ).catch(() => null)
    : null;

  if (!order) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Commande introuvable</h1>
        <p className="text-muted">
          Si vous avez payé, vos crédits apparaîtront dans votre solde dès la confirmation de
          l’opérateur.
        </p>
        <Link
          href="/profil"
          className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-contrast"
        >
          Voir mon solde
        </Link>
      </main>
    );
  }
  return <OrderStatus initial={order} />;
}
