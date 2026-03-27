# Multi-stage Dockerfile for TechHub (Next.js 16)
# Optimized for CI builds with pre-built artifacts
# Runner performs: npm ci + db:generate + build:fast before Docker build
#
# Prisma note: engineType = "client" uses WASM engine (no native binaries).
# All Prisma files live in src/generated/prisma — copied explicitly below.

# ====================
# Build Arguments
# ====================
ARG BASE_REGISTRY=jed.ocir.io/axbp9ow0rohq
ARG GIT_COMMIT=unknown
ARG GIT_COMMIT_FULL=unknown
ARG GIT_REF=local
ARG APP_VERSION=dev
ARG BUILD_DATE=unknown
ARG IMAGE_TAG=local
ARG PIPELINE_ID=local
ARG PIPELINE_URL=
ARG PROJECT_URL=


# ====================
# Stage 1: Builder (Pre-built Artifacts from CI Runner)
# ====================
# All artifacts are built on runner (faster native filesystem)
# This stage just packages them into the image
FROM ${BASE_REGISTRY}/node:22-alpine AS builder

WORKDIR /app

# Copy pre-built Next.js output
COPY .next ./.next

# Copy Prisma TypeScript types (not included in standalone)
COPY src/generated/prisma ./src/generated/prisma

# Copy static assets and startup script
COPY public ./public
COPY package.json ./package.json
COPY docker-start.mjs ./docker-start.mjs

# Migration & seed tooling (prisma CLI, tsx, source code for seed imports)
COPY node_modules ./node_modules
COPY src ./src
COPY prisma.config.ts ./prisma.config.ts
COPY tsconfig.json ./tsconfig.json
COPY scripts ./scripts

# ====================
# Stage 2: Runtime
# ====================
ARG BASE_REGISTRY
FROM ${BASE_REGISTRY}/node:22-alpine AS runner

# Install system dependencies
# NOTE: Use http mirrors to avoid local TLS MITM issues
RUN sed -i 's/https/http/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat curl postgresql-client

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment to production
ENV NODE_ENV=production

# Build metadata (injected by CI via --build-arg; defaults to "unknown"/"dev" for local builds)
ARG GIT_COMMIT
ARG GIT_COMMIT_FULL
ARG GIT_REF
ARG APP_VERSION
ARG BUILD_DATE
ARG IMAGE_TAG
ARG PIPELINE_ID
ARG PIPELINE_URL
ARG PROJECT_URL
ENV GIT_COMMIT=$GIT_COMMIT \
    GIT_COMMIT_FULL=$GIT_COMMIT_FULL \
    GIT_REF=$GIT_REF \
    APP_VERSION=$APP_VERSION \
    BUILD_DATE=$BUILD_DATE \
    IMAGE_TAG=$IMAGE_TAG \
    PIPELINE_ID=$PIPELINE_ID \
    PIPELINE_URL=$PIPELINE_URL \
    PROJECT_URL=$PROJECT_URL

# Copy Next.js standalone server and static files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma WASM client (engineType = "client") — not traced into standalone, explicit copy required
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma

# Copy package.json and startup script
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/docker-start.mjs ./docker-start.mjs

# Migration & seed tooling (used by Helm pre-upgrade Job and manual pod exec)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/scripts ./scripts

# Create directories for logs and uploads
RUN mkdir -p local/logs local/uploads && \
    chown -R nextjs:nodejs local

# Switch to non-root user
USER nextjs

# Expose port
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application (docker-start.mjs loads config from Spring Cloud Config Server, then starts server.js)
CMD ["node", "docker-start.mjs"]
