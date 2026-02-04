# Multi-stage Dockerfile for TechHub (Next.js 16)
# Optimized for CI builds with pre-built artifacts
# Runner performs: npm ci + db:generate + build:fast before Docker build

# ====================
# Build Arguments
# ====================
ARG BASE_REGISTRY=me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo

# ====================
# Stage 1: Builder (Pre-built Artifacts from CI Runner)
# ====================
# All artifacts are built on runner (faster native filesystem)
# This stage just packages them into the image
FROM ${BASE_REGISTRY}/node:22-alpine AS builder

WORKDIR /app

# Copy pre-built Next.js output (includes standalone server + dependencies)
COPY .next ./.next

# Copy Prisma artifacts (binaries + TypeScript types)
COPY node_modules/.prisma ./node_modules/.prisma
COPY src/generated/prisma ./src/generated/prisma

# Copy static assets
COPY public ./public
COPY package.json ./package.json

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

# Copy Next.js standalone server and static files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client (both generated types and binaries)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma

# Copy package.json
COPY --from=builder /app/package.json ./package.json

# Create directories for logs and uploads
RUN mkdir -p local/logs local/uploads && \
    chown -R nextjs:nodejs local

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "server.js"]
