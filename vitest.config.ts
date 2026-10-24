import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': dir('./src'),
      '@app': dir('./src/app'),
      '@core': dir('./src/core'),
      '@shared': dir('./src/shared'),
      '@modules': dir('./src/modules'),
      // `server-only` lève une erreur hors d'un bundle serveur Next : sous
      // Vitest, on le neutralise pour tester les fonctions qui l'importent.
      'server-only': dir('./src/test/server-only.stub.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'cobertura'],
      reportsDirectory: './coverage',
      // Le socle et les règles métier pures : ce qui casse en silence quand ça casse.
      // Les composants se vérifient à l'œil et en recette, pas au pourcentage.
      include: ['src/core/**/*.ts', 'src/shared/utils/**/*.ts', 'src/modules/**/*-rules.ts', 'src/modules/**/format.ts', 'src/modules/**/messages.ts'],
      exclude: ['src/**/types.ts', 'src/**/index.ts', 'src/core/i18n/locales/**'],
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
    },
  },
});
