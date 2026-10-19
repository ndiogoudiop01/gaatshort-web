# Contribuer

Même flux que `gaatshort-backend` (voir son `CONTRIBUTING.md`) :

```
main ──── protégée ; un tag vX.Y.Z déclenche la production (avec approbation)
 └── develop ──── protégée ; chaque fusion est déployée en staging
      └── feat/T3.5-accueil-vitrine
      └── fix/lecteur-reprise-position
```

- Toute modification passe par une **pull request vers `develop`**, revue et CI verte (statut `quality`).
- Commits : `type(scope): sujet`, en citant l'exigence et la tâche — `feat(storefront): rangées de
  l'accueil (FR-CAT-001, T3.5)`.
- Avant d'ouvrir la PR : `pnpm lint:ci && pnpm format:check && pnpm typecheck && pnpm test:ci && pnpm build`.
- Référence produit et écrans : `gaatshort-backend/docs/architecture/` (PRD, APPFLOW, UI/UX).
