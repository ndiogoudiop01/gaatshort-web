# Gaatshort — Site utilisateur

Site des marques de la plateforme de mini-séries **Gaatshort** : découverte, fiches série, lecteur
vertical, achat de crédits. **Next.js 16 (App Router, rendu serveur) · React 19 · Tailwind 4**,
installable en PWA, adossé à l'API `gaatshort-backend`.

> **État : Phase 3 — socle.** Configuration validée, résolution de la marque par l'hôte, client
> HTTP côté serveur, jetons du design system et polices auto-hébergées, sonde de santé, CI/CD.
> Les écrans (SCR-01 à SCR-17, 04-UI-UX-Design §10) arrivent en P3 à P6 selon le plan.

## Démarrer

```bash
cp .env.example .env
corepack enable && pnpm install
pnpm dev                       # http://localhost:3001 (l'API doit tourner sur :3000)
```

En local, l'hôte `localhost` ne désigne aucune marque : `DEV_TENANT=gaatshort` (la marque maison du
seed backend) est utilisée. En production `DEV_TENANT` est interdit et un hôte inconnu aboutit à
« marque introuvable » — jamais à l'affichage d'une autre marque.

| Script | Rôle |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | développement, build `standalone`, serveur de production |
| `pnpm lint:ci` · `pnpm format:check` · `pnpm typecheck` | qualité (bloquant en CI) |
| `pnpm test:ci` | tests unitaires + seuils de couverture (80 %) |

## Pages (v0)

| Route | Contenu |
|---|---|
| `/` | À la une, Reprendre, rangées, genres |
| `/decouvrir` | Recherche, filtre par genre, pagination |
| `/serie/[slug]` | Fiche (SEO + Open Graph), épisodes gratuits / verrouillés, Ma liste |
| `/regarder/[episodeId]` | Lecteur vertical HLS (hls.js, natif sur Safari), reprise, épisode suivant ; verrou → connexion, déblocage ou boutique |
| `/connexion` | Code SMS (+221 / +220) |
| `/boutique`, `/boutique/retour` | Packs de crédits ; retour de paiement qui attend la confirmation **vérifiée** de l'opérateur |
| `/ma-liste`, `/profil` | Favoris ; solde, déconnexion |
| `/manifest.webmanifest`, `/sitemap.xml`, `/robots.txt` | Installable sur l'écran d'accueil ; plan du site par marque |

Session : jetons dans des cookies `httpOnly` posés par le serveur Next (`src/core/session`). Les pages lisent, les Server Actions (`src/modules/viewer/actions.ts`) écrivent et rafraîchissent ; une page dont le jeton expire passe par `/session/refresh`.

## Principes

- **La marque vient de l'hôte**, résolu côté serveur (`src/core/tenancy/tenant-key.ts`) et transmis
  à l'API. Le navigateur ne choisit jamais la marque (02-TRD §4.3). La tâche T1.6 remplacera
  l'en-tête `x-tenant-id` par un en-tête interne signé.
- **Tous les appels à l'API partent du serveur** (`src/core/http/client.ts`, `server-only`) : URL de
  l'API hors du bundle, IP du visiteur transmise pour les quotas, aucun cache de données Next.
- **Aucune configuration dans l'image** : les variables sont lues au démarrage du conteneur,
  validées par Zod (`src/core/config/env.ts`). Une image est promue telle quelle de staging en production.
- **Design system** : jetons « Nuit de Dakar » dans `src/shared/styles/globals.css`. Une marque ne
  redéfinit que `--accent`, `--accent-contrast`, `--coin` et la police d'affichage.
- **Polices auto-hébergées** (`public/fonts`, licence OFL) : aucune requête vers un service tiers.

## Structure

```
src/
├── app/            routes (layout, accueil provisoire, /healthz, robots.txt)
├── core/           config · http (client serveur, enveloppe, erreurs) · tenancy (marque par hôte)
├── shared/         styles (jetons), utils (argent en unités mineures, E.164)
└── test/           stub `server-only` pour Vitest
```

## Déploiement

GitHub Actions → GHCR → CapRover (`.github/workflows/`) : `develop` → staging, tag `vX.Y.Z` →
production après approbation. Procédure et retour arrière : [`docs/deploiement.md`](docs/deploiement.md).
