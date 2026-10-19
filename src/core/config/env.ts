import { z } from 'zod';

/**
 * Contrat d'environnement du serveur Next, validé au premier accès.
 *
 * Aucune variable n'est préfixée `NEXT_PUBLIC_` : l'URL de l'API et la
 * résolution de la marque ne quittent jamais le serveur (02-TRD §4.3).
 */
const envSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  /** URL publique par défaut (liens canoniques hors contexte de requête). */
  SITE_URL: z.string().url().default('http://localhost:3001'),

  /** Base de l'API, préfixe et version inclus. Joindre l'API directement, sans proxy intermédiaire. */
  API_BASE_URL: z.string().url().default('http://localhost:3000/api/v1'),
  API_TIMEOUT_MS: z.coerce.number().int().min(500).max(60_000).default(8_000),
  /** Doit valoir `TENANCY_HEADER_NAME` du backend. */
  TENANCY_HEADER_NAME: z.string().min(1).default('x-tenant-id'),

  /**
   * Marque utilisée quand l'hôte n'identifie aucune marque : `localhost`, IP, nom de service.
   * En production, laisser vide : un hôte inconnu doit aboutir à une page « marque introuvable »,
   * jamais à l'affichage silencieux d'une autre marque.
   */
  DEV_TENANT: z.string().optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): ServerEnv {
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value.trim() !== ''),
  );
  const parsed = envSchema.safeParse(cleaned);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(racine)'} : ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration d'environnement invalide :\n${issues}`);
  }
  if (parsed.data.APP_ENV === 'production' && parsed.data.DEV_TENANT) {
    throw new Error(
      'Configuration d’environnement invalide :\n  • DEV_TENANT : interdit en production',
    );
  }
  return parsed.data;
}

let cached: ServerEnv | null = null;

/** Lu paresseusement : `next build` ne doit pas exiger les variables de production. */
export function env(): ServerEnv {
  cached ??= parseEnv(process.env);
  return cached;
}
