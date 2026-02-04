# Multi-stage Dockerfile for TechHub (Next.js 16)
# Optimized for production deployment on Kubernetes

# ====================
# Build Arguments
# ====================
# BASE_REGISTRY: Container registry hosting the Node.js base image
# Defaults to Docker Hub for local testing
# GitLab CI overrides this with jed.ocir.io/axbp9ow0rohq for production builds
ARG BASE_REGISTRY=docker.io/library

# ====================
# Stage 1: Dependencies (Local Builds Only)
# ====================
# This stage is ONLY used for local Docker builds (docker-local.sh)
# CI builds skip this stage and copy pre-built artifacts from runner
FROM ${BASE_REGISTRY}/node:22-alpine AS deps

# Install minimal system dependencies
# - libc6-compat: Required for Node.js compatibility on Alpine
# - python3, make, g++: Required for native modules (sharp image processing)
# NOTE: Use http mirrors to avoid local TLS MITM issues when fetching APKINDEX
RUN sed -i 's/https/http/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (production + dev for build)
RUN npm ci --include=dev

# ====================
# Stage 2: Builder (Pre-built Artifacts)
# ====================
# Copies all pre-built artifacts from CI runner
# Runner performs: npm ci + db:generate + build:fast
# This eliminates ~5-10 minutes of duplicate build work

# Re-declare ARG to use in this stage (inherits value from global or --build-arg)
ARG BASE_REGISTRY
FROM ${BASE_REGISTRY}/node:22-alpine AS builder

WORKDIR /app

# Copy all pre-built artifacts from runner
# (included in Docker context via temporary .dockerignore modification)
COPY node_modules ./node_modules
COPY .next ./.next
COPY src/generated/prisma ./src/generated/prisma
COPY public ./public
COPY package.json ./package.json

# Note: All artifacts are pre-built on runner (faster native filesystem)
# CI builds bypass the deps stage entirely

# ====================
# Stage 3: Runner
# ====================
# Re-declare ARG to use in this stage (inherits value from global or --build-arg)
ARG BASE_REGISTRY
FROM ${BASE_REGISTRY}/node:22-alpine AS runner

# Install system dependencies
# NOTE: Use http mirrors to avoid local TLS MITM issues when fetching APKINDEX
RUN sed -i 's/https/http/g' /etc/apk/repositories && \
    apk add --no-cache \
    libc6-compat \
    curl \
    postgresql-client

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment to production
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma

# Copy package.json for runtime dependencies check
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
