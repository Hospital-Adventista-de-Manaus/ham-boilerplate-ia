# syntax=docker/dockerfile:1.7
# Build context esperado: raiz do monorepo
# Coolify: aponte "Base Directory" = / e "Dockerfile Location" = apps/web/Dockerfile

ARG NODE_VERSION=24.16.0-alpine

# ───────────────────────────────────────────────
# 1) Base com pnpm + corepack
# ───────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# ───────────────────────────────────────────────
# 2) Instala deps (cache eficiente)
# ───────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# ───────────────────────────────────────────────
# 3) Build do app web
# ───────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /repo /repo
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Build id do WEB para o selo e o aviso de nova versão: SOURCE_COMMIT (o
# Coolify injeta em builds git) ou um carimbo AAMMDD.HHMM, que muda a cada
# deploy. Gravado no .env.production para o Next embutir no build.
# (Não usar `ENV ...=$SOURCE_COMMIT`: valor vazio sobrescreveria o arquivo.)
ARG SOURCE_COMMIT=
RUN BUILD_ID="${SOURCE_COMMIT:-$(date -u +%y%m%d.%H%M)}" \
    && echo "NEXT_PUBLIC_GIT_SHA=$BUILD_ID" >> apps/web/.env.production

RUN pnpm --filter @app/web build

# ───────────────────────────────────────────────
# 4) Runner (standalone output)
# ───────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ > /dev/null || exit 1

CMD ["node", "apps/web/server.js"]
