# Multi-stage Dockerfile for TechHub (Next.js 16)
# Optimized for production deployment on Kubernetes

# ====================
# Stage 1: Dependencies
# ====================
FROM node:20-alpine AS deps

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
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build arguments
ARG NODE_ENV=production
ARG NEXT_PUBLIC_APP_VERSION
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# Mock DATABASE_URL for build (Prisma client initialization)
# Actual DATABASE_URL will be provided at runtime via K8s secrets
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV REDIS_URL="redis://localhost:6379"

# Build Next.js application
RUN npm run build:fast

# ====================
# Stage 3: Runner
# ====================
FROM node:20-alpine AS runner

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
