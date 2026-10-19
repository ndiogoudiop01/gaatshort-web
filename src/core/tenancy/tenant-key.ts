/**
 * Identification de la marque (tenant) à partir de l'hôte de la requête — 02-TRD §4.3.
 *
 * Le navigateur ne choisit JAMAIS la marque : seul l'hôte sur lequel il est arrivé compte
 * (`kaay-drama.gaatshort.com`, `www.marque.sn`). Le serveur Next transmet cet hôte à l'API, qui
 * le résout via `tenant_domains`. La tâche T1.6 remplacera l'en-tête `x-tenant-id` par un
 * en-tête interne signé (HMAC), pour que l'API n'ait plus à accepter un identifiant libre.
 */

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/** `Kaay-Drama.Gaatshort.com:443` → `kaay-drama.gaatshort.com` ; hôte sans point ou IP → `null`. */
export function normalizeHost(rawHost: string | null | undefined): string | null {
  if (!rawHost) return null;
  let host = rawHost.trim().toLowerCase();
  if (host.startsWith('[')) return null; // IPv6 littérale
  host = host.replace(/:\d+$/, '').replace(/\.$/, '');
  if (!host.includes('.') || IPV4.test(host)) return null;
  if (!/^[a-z0-9.-]+$/.test(host)) return null;
  return host;
}

/**
 * Clé transmise à l'API pour la marque courante : l'hôte s'il est exploitable, sinon la marque
 * de développement (jamais en production, cf. `env.ts`), sinon `null` (→ page « marque introuvable »).
 */
export function tenantKeyFor(
  rawHost: string | null | undefined,
  devTenant?: string,
): string | null {
  return normalizeHost(rawHost) ?? devTenant ?? null;
}
