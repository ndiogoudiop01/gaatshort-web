import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Mêmes frontières que `gaatshort-backoffice`, pour les mêmes raisons :
 *
 *   app → modules → shared → core. Jamais l'inverse.
 *
 *  - `app/` ne contient que des routes : il assemble les modules ;
 *  - un module ne connaît pas les entrailles d'un autre module ;
 *  - `shared/` ne connaît aucun module ;
 *  - `core/` ne connaît ni `shared/`, ni les modules, ni les routes.
 *
 * Une règle affichée sans vérification s'érode en trois sprints : celle-ci
 * est bloquante en CI (`pnpm lint:ci`).
 */
const boundary = (files, patterns) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
});

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // Les visuels sont des .webp déjà optimisés, servis tels quels depuis /public.
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  boundary(
    ['src/modules/**/*.{ts,tsx}'],
    [
      {
        group: ['@modules/*/**', '@/modules/**'],
        message:
          "Frontière de module : un module ne peut pas importer les entrailles d'un autre. Passez par @core ou @shared.",
      },
      {
        group: ['@app/**', '@/app/**'],
        message: 'Un module ne connaît pas les routes : ce sont elles qui l’assemblent.',
      },
      {
        group: ['../../*/**'],
        message: 'Remontée hors du module par chemin relatif. Utilisez un alias (@core, @shared).',
      },
    ],
  ),

  boundary(
    ['src/shared/**/*.{ts,tsx}'],
    [
      {
        group: ['@modules/**', '@/modules/**', '@app/**', '@/app/**'],
        message:
          "Une brique partagée ne connaît aucun module — sinon elle n'est pas partagée, elle appartient à ce module.",
      },
    ],
  ),

  boundary(
    ['src/core/**/*.{ts,tsx}'],
    [
      {
        group: ['@modules/**', '@/modules/**', '@app/**', '@/app/**', '@shared/**', '@/shared/**'],
        message:
          'Inversion de dépendance : le socle ne connaît ni les modules, ni les briques partagées, ni les routes.',
      },
    ],
  ),

  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'reports/**', 'next-env.d.ts']),
]);
