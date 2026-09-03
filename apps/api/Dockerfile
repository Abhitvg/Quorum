FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies, pnpm and turbo
RUN apk add --no-cache python3 make g++ git && npm install -g pnpm turbo

# Copy root configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy source code
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages
# We don't need the actual source code of web or agent to build API, just their package.json to satisfy workspace

# Install dependencies and build
RUN pnpm install
RUN pnpm --prefix apps/api run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++ && npm install -g pnpm

# Copy package configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages ./packages

# Install production dependencies only
RUN pnpm install --prod --filter=@quorum/api...


# Copy compiled code
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Expose port (default NestJS)
EXPOSE 3001

# Start the application with dd-trace auto-instrumentation
CMD ["node", "--require", "dd-trace/init", "apps/api/dist/main"]
