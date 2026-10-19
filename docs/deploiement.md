# Déploiement du site utilisateur (GitHub Actions → GHCR → CapRover)

| | |
|---|---|
| Image | `ghcr.io/<owner>/gaatshort-web:<sha court>` (serveur Next `standalone`) |
| Déclencheurs | push sur `develop` → **staging** ; tag `vX.Y.Z` → **production** (approbation) |
| Méthode | `caprover deploy --imageName` + jeton d'application |

Rien n'est reconstruit au déploiement : CapRover exécute l'image validée par la CI. La configuration
(`APP_ENV`, `API_BASE_URL`, `TENANCY_HEADER_NAME`) est lue au démarrage du conteneur.

## Mise en place (une fois par environnement)

1. **DNS** : chaque domaine de marque (sous-domaine `<marque>.gaatshort.com` ou domaine propre) →
   IP du serveur CapRover. Le domaine est aussi déclaré dans la marque (back-office BO-13,
   `tenant_domains`), sinon l'API ne la reconnaît pas.
2. **CapRover** : créer l'app `gaatshort-web` (staging : `gaatshort-web-staging`), port conteneur
   **3000**, HTTPS ; ajouter chaque domaine de marque à l'app. Variables : `APP_ENV`, `API_BASE_URL`
   (adresse **interne** de l'API, ex. `http://srv-captain--gaatshort-api/api/v1`, pour que le
   backend voie un seul saut), `TENANCY_HEADER_NAME`. **Pas** de `DEV_TENANT` en production.
   Générer l'App Token.
3. **Registre** : Cluster › Docker Registries › `ghcr.io` (jeton GitHub `read:packages`).
4. **GitHub** : environnements `staging` et `production` avec `CAPROVER_URL`, `CAPROVER_APP`,
   `PUBLIC_URL` (variables) et `CAPROVER_APP_TOKEN` (secret) ; reviewers obligatoires en production ;
   protection des branches `main` et `develop` (PR + statut `quality` requis).

## Retour arrière

Le site est sans état : redéployer l'image précédente
(`caprover deploy … --imageName ghcr.io/<owner>/gaatshort-web:<sha précédent>`) ou relancer le
workflow `deploy` du tag précédent. Le site et l'API sont compatibles N-1 (API versionnée).
