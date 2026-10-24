'use client';

import { useActionState } from 'react';
import { otpAction, type OtpState } from '../actions';
import { SubmitButton } from './submit-button';

const input =
  'w-full rounded-[var(--radius-card)] border border-border bg-surface-1 px-4 py-3 text-base outline-none focus:border-accent';

/** Connexion en deux temps : numéro, puis code reçu par SMS. */
export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<OtpState, FormData>(otpAction, { step: 'phone', next });

  if (state.step === 'code') {
    return (
      <form action={action} className="flex flex-col gap-4" key="code">
        <p className="text-muted">
          Code envoyé au <strong className="text-text">{state.phone}</strong>.
        </p>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Code à 6 chiffres
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="\d{6}"
            required
            autoFocus
            className={`${input} tracking-[0.5em]`}
          />
        </label>
        {state.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
        <SubmitButton
          className="rounded-full bg-accent py-3 font-semibold text-accent-contrast"
          pendingLabel="Vérification…"
        >
          Valider
        </SubmitButton>
        <div className="flex justify-between text-sm">
          <button name="intent" value="change" className="text-muted hover:text-text">
            Changer de numéro
          </button>
          <button
            name="intent"
            value="resend"
            className="text-muted hover:text-text"
            formNoValidate
          >
            Renvoyer le code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" key="phone">
      <input type="hidden" name="next" value={state.next} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Numéro de téléphone
        <span className="flex gap-2">
          <select
            name="dial"
            defaultValue="+221"
            className={`${input} w-28 shrink-0`}
            aria-label="Indicatif"
          >
            <option value="+221">🇸🇳 +221</option>
            <option value="+220">🇬🇲 +220</option>
          </select>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="77 123 45 67"
            required
            autoFocus
            className={input}
          />
        </span>
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton
        className="rounded-full bg-accent py-3 font-semibold text-accent-contrast"
        pendingLabel="Envoi du code…"
      >
        Recevoir un code par SMS
      </SubmitButton>
    </form>
  );
}
