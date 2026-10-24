'use client';

import { useFormStatus } from 'react-dom';

/** Bouton neutralisé pendant l'envoi : un double clic ne crée pas deux commandes. */
export function SubmitButton({
  children,
  className = '',
  pendingLabel = 'Patientez…',
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:opacity-60`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
