# NOTE: This Dockerfile is designed to be built from the monorepo root context.
# To build manually: docker build -f apps/web/Dockerfile .
FROM node:20-alpine AS base

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root workspace configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy web app package.json (and API for workspace resolution)
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
WORKDIR /app

RUN npm install -g pnpm turbo

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy root configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy web source
COPY apps/web ./apps/web

# Build argument for API URL (baked into the Next.js bundle at build time)
ARG NEXT_PUBLIC_API_URL=https://api.quorum.atma-ai.co.in
ARG NEXT_PUBLIC_LIVEKIT_URL=wss://quorum-oor689rg.livekit.cloud

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_LIVEKIT_URL=$NEXT_PUBLIC_LIVEKIT_URL

# Build Next.js in standalone mode
RUN pnpm --filter @quorum/web run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Install dd-trace for APM in the runner
RUN cd apps/web && npm install dd-trace@latest --no-save

USER nextjs

EXPOSE 3000

# Start with dd-trace auto-instrumentation
CMD ["node", "--require", "dd-trace/init", "apps/web/server.js"]
