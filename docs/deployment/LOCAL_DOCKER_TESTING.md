# Local Docker Testing Guide

This guide explains how to test the full Docker deployment locally before pushing to GitLab CI/CD.

## Overview

The project supports multiple deployment methods:

- **Native Development**: `npm run dev` (local macOS with PostgreSQL/Redis via Homebrew)
- **Local Docker (Fast)**: `./scripts/dev/docker-local.sh` (two-step build: native + Docker packaging - **recommended for local testing**)
- **Local Docker (Full)**: `docker compose up` (complete production build in Docker - slower but matches CI exactly)
- **GitLab CI/CD**: Automated builds with Kaniko → ArgoCD → Kubernetes

Local Docker testing allows you to:

- ✅ Test the full production-like Docker build
- ✅ Verify Dockerfile changes before pushing to CI
- ✅ Test database migrations in a containerized environment
- ✅ Catch Docker-specific issues early
- ✅ Test the complete stack (app + PostgreSQL + Redis) in isolation

### Two Approaches Available

**1. Fast Local Build** (Recommended for daily Docker testing)

- Build on host (native macOS - **~7 seconds**)
- Package in Docker (**~25 seconds**)
- Total: **~32 seconds** vs 30+ minutes
- Uses: `docker-compose.local.yml` + `Dockerfile.local`
- Matches GitLab CI approach exactly

**2. Full Production Build** (Use when testing Dockerfile changes)

- Complete build inside Docker
- Slower but exact replica of production build
- Total: **20-30 minutes** on macOS
- Uses: `docker-compose.yml` + `Dockerfile`

## Prerequisites

- Docker Desktop installed and running
- `.env.docker` file configured (see setup below)

## Quick Start

### Option A: Fast Local Build (Recommended)

The fast approach builds on your native macOS (fast) and packages in Docker (fast):

```bash
# npm script (recommended shortcut):
npm run docker:local          # build:fast + docker compose up --build -d
npm run docker:local:logs     # follow app logs
npm run docker:local:down     # stop containers

# Or use the helper script directly:
./scripts/dev/docker-local.sh
./scripts/dev/docker-local.sh -d   # detached mode
```

**Total time: ~32 seconds** 🚀

### Option B: Full Production Build

Use this when you need to test Dockerfile changes:

```bash
# Build and start all services (app, PostgreSQL, Redis)
docker compose up --build

# Or run in detached mode (background)
docker compose up --build -d
```

**Total time: ~20-30 minutes** (builds everything inside Docker)

### Access the Application

**Fast Local Build** (docker-compose.local.yml):

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5433 (user: `techhub`, password: `techhub_local_password`, db: `techhub`)
- **Redis**: localhost:6380

**Full Production Build** (docker-compose.yml):

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5432 (user: `techhub`, password: `techhub_local_password`, db: `techhub`)
- **Redis**: localhost:6379

### View Logs

```bash
# Fast build (docker-compose.local.yml)
docker compose -f docker-compose.local.yml logs app -f

# Full build (docker-compose.yml)
docker compose logs app -f

# View all logs
docker compose logs -f

# View specific service
docker compose logs postgres -f
```

### Stop Services

```bash
# Stop fast build
docker compose -f docker-compose.local.yml down

# Stop full build
docker compose down

# Remove everything including volumes (fresh start)
docker compose -f docker-compose.local.yml down -v
```

## How the Fast Build Works

The fast local build approach matches exactly how GitLab CI works:

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Build on Host (Native macOS - FAST)                 │
├─────────────────────────────────────────────────────────────┤
│ npm run build:fast                                          │
│ ├── Next.js build (~7s with Turbopack)                     │
│ ├── Generates .next/standalone/                             │
│ ├── Generates .next/static/                                 │
│ └── Uses native macOS filesystem (optimal performance)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Package in Docker (FAST)                            │
├─────────────────────────────────────────────────────────────┤
│ Docker build with Dockerfile.local                          │
│ ├── Copy pre-built artifacts (~25s)                        │
│ ├── No npm install (standalone includes deps)              │
│ ├── No Next.js build (already done)                        │
│ └── Just packages and configures runtime                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Run Containers                                       │
├─────────────────────────────────────────────────────────────┤
│ docker compose -f docker-compose.local.yml up               │
│ ├── PostgreSQL on port 5433                                │
│ ├── Redis on port 6380                                     │
│ └── App on port 3000                                        │
└─────────────────────────────────────────────────────────────┘
```

### Files Used

- **Dockerfile.local**: Lightweight Dockerfile that only packages pre-built artifacts
- **docker-compose.local.yml**: Compose file with local-friendly ports (5433, 6380)
- **.dockerignore.local**: Includes `.next/` directory (needed for packaging)
- **scripts/dev/docker-local.sh**: Automated helper script

### Why It's Fast

1. **Native Build**: macOS filesystem is ~10x faster than Docker's virtualized filesystem
2. **No Dependencies**: Standalone build includes all runtime dependencies
3. **No Build Step**: Docker just copies files, doesn't compile anything
4. **Optimized Context**: Only copies what's needed for runtime

## Configuration

### Environment Variables

The `docker-compose.yml` uses `.env.docker` for configuration. Key variables:

```bash
# Required
BETTER_AUTH_SECRET=your-secret-here    # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: only needed when accessing from additional browser origins
# For single-origin local Docker, omit TRUSTED_ORIGINS so it falls back to BETTER_AUTH_URL.
# Add your machine's network IP only if accessing Docker from a different host/port.
# TRUSTED_ORIGINS=http://localhost:3000,http://YOUR_IP:3000

# Optional
LOG_LEVEL=info                         # debug, info, warn, error
```

**`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`**: Set both to the canonical public URL you use in the browser. For local Docker, the default is `http://localhost:3000`.

**`TRUSTED_ORIGINS`**: Controls extra origins Better Auth accepts auth requests from. Leave it unset for a single-origin setup; set it only when your browser accesses the app from a URL different from `BETTER_AUTH_URL` (e.g., a network IP or a different port). Without a matching trusted origin, auth requests return `403 INVALID_ORIGIN`.

### Default Configuration

If `.env.docker` doesn't exist, the compose file uses these defaults:

- **Database**: PostgreSQL 16 on port 5432
  - Database: `techhub`
  - User: `techhub`
  - Password: `techhub_local_password`

- **Redis**: Redis 7 on port 6379

- **App**: Next.js on port 3000
  - Runs migrations automatically on startup
  - Seeds database if empty
  - Production mode (`NODE_ENV=production`)

## Docker Build Configuration

### Base Image Registry

The Dockerfile uses build args to support both local and CI environments:

**Local (default)**:

```dockerfile
ARG BASE_REGISTRY=docker.io/library
FROM ${BASE_REGISTRY}/node:22-alpine
# Resolves to: docker.io/library/node:22-alpine (Docker Hub public image)
```

**GitLab CI (overridden)**:

```bash
docker build --build-arg BASE_REGISTRY=jed.ocir.io/axbp9ow0rohq .
# Resolves to: jed.ocir.io/axbp9ow0rohq/node:22-alpine (private registry)
```

This allows:

- ✅ Local testing without private registry authentication
- ✅ CI/CD uses optimized private images
- ✅ Same Dockerfile works in all environments

## Testing Workflow

### Test Dockerfile Changes Locally

```bash
# 1. Make changes to Dockerfile
vim Dockerfile

# 2. Rebuild and test
docker compose up --build

# 3. Verify app starts successfully
curl http://localhost:3000/health

# 4. Test functionality
# Navigate to http://localhost:3000 and test features

# 5. If successful, commit and push to GitLab
git add Dockerfile
git commit -m "fix: update Dockerfile..."
git push gitlab dev
```

### Test Database Migrations

```bash
# Start fresh
docker compose down -v

# Build and start (migrations run automatically)
docker compose up --build

# Check migration logs
docker compose logs app | grep migration

# Verify database schema
docker compose exec postgres psql -U techhub -c "\dt"
```

### Test Database Seeding

```bash
# Seeding happens automatically on first run
docker compose up --build

# Check seed logs
docker compose logs app | grep seed

# Verify data
docker compose exec postgres psql -U techhub -c "SELECT COUNT(*) FROM \"Person\";"
```

## Troubleshooting

### Issue: Docker build fails with npm peer dependency errors

**Cause**: `better-auth@1.4.4` declares `peerOptional next@"^14||^15"` but the project uses Next.js 16. npm strict mode rejects this.

**Solution**: `Dockerfile.local` uses `--legacy-peer-deps` flag to bypass this:

```dockerfile
RUN HUSKY=0 npm ci --include=dev --legacy-peer-deps
```

This is already configured — no action needed unless you see it missing after a Dockerfile edit.

### Issue: `react-is` or other packages missing after install with `--legacy-peer-deps`

**Cause**: `--legacy-peer-deps` can drop transitive dependencies that rely on peer resolution (e.g., `recharts` → `react-is`).

**Solution**: Explicitly reinstall the missing package:

```bash
npm install react-is --legacy-peer-deps
```

Then rebuild Docker: `npm run docker:local`

### Issue: `403 INVALID_ORIGIN` on auth requests

**Cause**: better-auth rejects requests from an origin not listed in `TRUSTED_ORIGINS`.

**Solution**: Add the origin to `TRUSTED_ORIGINS` in `docker-compose.local.yml`:

```yaml
TRUSTED_ORIGINS: http://localhost:3000,http://YOUR_IP:3000
```

Keep `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` set to the canonical URL for the environment. `TRUSTED_ORIGINS` is only for additional browser origins.

### Issue: Build fails with "bash: not found"

**Cause**: Alpine Linux doesn't include bash by default.

**Solution**: Ensure Dockerfile has this line in the builder stage:

```dockerfile
RUN apk add --no-cache bash
```

### Issue: Can't resolve private registry images

**Cause**: Trying to use GitLab's private registry (`jed.ocir.io`) locally without authentication.

**Solution**: The Dockerfile now defaults to Docker Hub. Ensure you're using the latest version:

```bash
git pull github dev
docker compose up --build
```

### Issue: Database connection errors

**Cause**: PostgreSQL not fully started when app tries to connect.

**Solution**: The compose file includes health checks. If issues persist:

```bash
# Restart services
docker compose restart app

# Or check PostgreSQL logs
docker compose logs postgres
```

### Issue: Port already in use

**Cause**: Another process is using Docker ports.

**Solution**:

For **Fast Build** (uses ports 5433, 6380, 3000):

```bash
# Check what's using the ports
lsof -i :5433  # PostgreSQL
lsof -i :6380  # Redis
lsof -i :3000  # App

# If your native PostgreSQL/Redis are running on 5432/6379,
# fast build avoids conflicts by using 5433/6380
```

For **Full Build** (uses ports 5432, 6379, 3000):

```bash
# Stop native services first
brew services stop postgresql@16
brew services stop redis

# Or use fast build instead (avoids conflicts)
./scripts/dev/docker-local.sh
```

### Issue: Changes not reflected in container

**Cause**: Docker using cached layers.

**Solution**: Force rebuild:

```bash
docker compose build --no-cache
docker compose up
```

## Advanced Usage

### Use Different Node Version

```bash
# Build with specific Node version
docker compose build --build-arg BASE_REGISTRY=docker.io/library --build-arg NODE_VERSION=20
```

### Connect to Running Container

```bash
# Get a shell in the app container
docker compose exec app sh

# Check Prisma client
docker compose exec app npx prisma --version

# Run migrations manually
docker compose exec app npx prisma migrate deploy
```

### Inspect Volumes

```bash
# List volumes
docker volume ls | grep techhub

# Inspect PostgreSQL data
docker volume inspect techhub-postgres-local

# Remove volumes (fresh start)
docker volume rm techhub-postgres-local techhub-redis-local
```

### Custom Database URL

Override in `.env.docker`:

```bash
# Use external PostgreSQL
DATABASE_URL=postgresql://user:pass@host.docker.internal:5432/db
```

## Comparison: Development Approaches

| Aspect                | Native Dev      | Docker Fast                     | Docker Full         |
| --------------------- | --------------- | ------------------------------- | ------------------- |
| **Startup Time**      | ~5s             | ~32s                            | ~20-30min           |
| **Hot Reload**        | Yes (Turbopack) | No (rebuild)                    | No (rebuild)        |
| **Resource Usage**    | Light           | Medium                          | Heavy               |
| **Isolation**         | Shared system   | Fully isolated                  | Fully isolated      |
| **Production Parity** | Medium          | High                            | Highest             |
| **Best For**          | Daily dev       | Docker testing                  | Dockerfile changes  |
| **Command**           | `npm run dev`   | `./scripts/dev/docker-local.sh` | `docker compose up` |

**Recommendations**:

- ✅ **Daily development**: Use native dev (`npm run dev`)
- ✅ **Test Docker deployment**: Use fast build (`./scripts/dev/docker-local.sh`)
- ✅ **Test Dockerfile changes**: Use full build (`docker compose up --build`)
- ✅ **Before pushing to GitLab**: Run fast build to verify Docker packaging works

## CI/CD Integration

The same Dockerfile is used in GitLab CI with these overrides:

```yaml
# .gitlab-ci.yml
/kaniko/executor \
--build-arg BASE_REGISTRY=jed.ocir.io/axbp9ow0rohq \
--build-arg APP_VERSION=${version} \
--build-arg GIT_COMMIT=${commit_id} \
--build-arg GIT_COMMIT_FULL=${CI_COMMIT_SHA} \
--build-arg GIT_REF=${CI_COMMIT_REF_NAME} \
--build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
--build-arg IMAGE_TAG=${IMAGE_TAG} \
--build-arg PIPELINE_ID=${CI_PIPELINE_ID} \
--build-arg PIPELINE_URL=${CI_PIPELINE_URL} \
--build-arg PROJECT_URL=${CI_PROJECT_URL} \
--context ${CI_PROJECT_DIR} \
--dockerfile ${CI_PROJECT_DIR}/Dockerfile \
--destination ${FULL_IMAGE_NAME}
```

This ensures:

- Same build process locally and in CI
- Dockerfile changes tested locally first
- Consistent production images

## Next Steps

- See [GITLAB_CI_SETUP.md](GITLAB_CI_SETUP.md) for CI/CD pipeline details
- See [KUBERNETES_OPERATIONS.md](KUBERNETES_OPERATIONS.md) for K8s deployment
- See [BUILD_STEPS.md](BUILD_STEPS.md) for build process internals
