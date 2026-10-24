import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { readSession } from '@core/session/session';
import { safeNext } from '@core/session/jwt';
import { storefrontConfig } from '@modules/viewer/data';
import { LoginForm } from '@modules/viewer/components/login-form';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next ?? '/');
  const session = await readSession();
  if (session.refreshToken) redirect(next);
  const config = await storefrontConfig().catch(() => null);

  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Connexion</h1>
        <p className="mt-2 text-muted">Recevez un code par SMS. Pas de mot de passe à retenir.</p>
        {config?.accountNotice && <p className="mt-2 text-xs text-muted">{config.accountNotice}</p>}
      </div>
      <LoginForm next={next} />
      <p className="text-xs text-muted">
        En continuant, vous acceptez les conditions d’utilisation et la politique de
        confidentialité.
      </p>
    </main>
  );
}
