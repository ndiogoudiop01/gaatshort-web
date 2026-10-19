# syntax=docker/dockerfile:1.7
# ==============================================================================
#  Site utilisateur Gaatshort — image de production
#
#  Contrairement au back-office (fichiers statiques servis par nginx), le site
#  a besoin d'un serveur Node : rendu serveur des pages et appels à l'API
#  depuis le serveur (la marque est résolue par l'hôte). On embarque donc la sortie `standalone` de
#  Next — le serveur et le strict nécessaire de node_modules — et rien d'autre :
#  ni pnpm, ni les sources, ni les dépendances de développement.
# ==============================================================================

# ------------------------------- deps ----------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV CI=true
RUN corepack enable

# Les manifestes d'abord : tant qu'ils ne changent pas, Docker réutilise la
# couche d'installation, de loin la plus lente.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prefer-offline

# ------------------------------- build ---------------------------------------
FROM deps AS build

COPY . .

# Aucune variable d'environnement de production ici : elles sont lues au
# DÉMARRAGE du conteneur (`core/config/env.ts`, lecture paresseuse), pas au
# build. Une seule image, promue telle quelle de la recette à la production.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ------------------------------- runtime -------------------------------------
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# `tini` en PID 1 : sans initialiseur, SIGTERM n'atteindrait pas Node et
# Docker Swarm attendrait le délai de grâce à chaque déploiement.
RUN apk add --no-cache tini \
  && addgroup -S -g 1001 web \
  && adduser -S -u 1001 -G web web

COPY --from=build --chown=web:web /app/.next/standalone ./
COPY --from=build --chown=web:web /app/.next/static ./.next/static
COPY --from=build --chown=web:web /app/public ./public

USER web
EXPOSE 3000

# La sonde est déclarée sur le SERVICE (docker-compose.yml, CapRover), pas
# dans l'image — même règle que le backend et le back-office.

ENTRYPOINT ["/sbin/tini", "--"]
# HOSTNAME force ICI et non par `ENV` : Docker Swarm (CapRover) pose
# HOSTNAME=<id du conteneur>, et le serveur standalone de Next n'ecouterait
# alors que sur l'IP de ce nom -> ni la sonde (127.0.0.1) ni nginx de CapRover
# (reseau captain-overlay) ne le joignent : 502.
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 exec node server.js"]
