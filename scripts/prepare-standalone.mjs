/**
 * `output: 'standalone'` ne copie ni `public/` ni `.next/static/` dans
 * `.next/standalone` : un CDN est censé les servir. Sans CDN (recette,
 * `pnpm start` en local), `server.js` les sert lui-même s'ils sont à côté de
 * lui. L'image Docker fait la même copie (cf. docker/Dockerfile).
 */
import { cpSync, existsSync } from 'node:fs';

if (!existsSync('.next/standalone')) {
  console.error('[standalone] .next/standalone absent : lancez `pnpm build` d’abord.');
  process.exit(1);
}
cpSync('public', '.next/standalone/public', { recursive: true });
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
console.log('[standalone] public/ et .next/static copiés.');

// `server.js` fait `chdir(__dirname)` et lit donc les `.env*` de
// `.next/standalone`, pas ceux du projet : sans cette copie, `pnpm start`
// échoue sur « TENANTS : Required ». L'image Docker, elle, reçoit ses
// variables de l'environnement du conteneur.
for (const file of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  if (existsSync(file)) {
    cpSync(file, `.next/standalone/${file}`);
    console.log(`[standalone] ${file} copié.`);
  }
}
