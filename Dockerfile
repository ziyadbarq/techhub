# Multi-stage Dockerfile for TechHub (Next.js 16)
# Optimized for production deployment on Kubernetes

# ====================
# Build Arguments
# ====================
# BASE_REGISTRY: Container registry hosting the Node.js base image
# Defaults to OCI registry, can be overridden for GCP or other clouds
ARG BASE_REGISTRY=jed.ocir.io/axbp9ow0rohq

# ====================
# Stage 1: Dependencies
# ====================
FROM ${BASE_REGISTRY}/node:22-alpine AS deps

# Install system dependencies for node-gyp
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (production + dev for build)
RUN npm ci --include=dev

# ====================
# Stage 2: Builder
# ====================
# Reuse BASE_REGISTRY from build args
ARG BASE_REGISTRY=jed.ocir.io/axbp9ow0rohq
FROM ${BASE_REGISTRY}/node:22-alpine AS builder

# Install bash for build scripts (Alpine uses sh by default)
RUN apk add --no-cache bash

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build arguments and environment setup
ARG NODE_ENV=production
ARG NEXT_PUBLIC_APP_VERSION
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# Mock DATABASE_URL for build (Prisma client initialization)
# Actual DATABASE_URL will be provided at runtime via K8s secrets
# MUST be set BEFORE running prisma generate
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV REDIS_URL="redis://localhost:6379"

# Set CI environment for db:generate script
ENV CI=true

# Generate Prisma client and entry points (requires DATABASE_URL and CI to be set)
# This runs prisma generate + recreates entry point files (index.ts, server.ts, types.ts)
RUN npm run db:generate

# Build Next.js application
RUN npm run build:fast

# ====================
# Stage 3: Runner
# ====================
# Reuse BASE_REGISTRY from build args
ARG BASE_REGISTRY=jed.ocir.io/axbp9ow0rohq
FROM ${BASE_REGISTRY}/node:22-alpine AS runner

# Install system dependencies
RUN apk add --no-cache \
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
