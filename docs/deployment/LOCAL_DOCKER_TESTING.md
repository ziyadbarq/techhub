# Local Docker Testing Guide

This guide explains how to test the full Docker deployment locally before pushing to GitLab CI/CD.

## Overview

The project supports multiple deployment methods:
- **Native Development**: `npm run dev` (local macOS with PostgreSQL/Redis via Homebrew)
- **Local Docker**: `docker compose up` (full containerized stack - **this guide**)
- **GitLab CI/CD**: Automated builds with Kaniko → ArgoCD → Kubernetes

Local Docker testing allows you to:
- ✅ Test the full production-like Docker build
- ✅ Verify Dockerfile changes before pushing to CI
- ✅ Test database migrations in a containerized environment
- ✅ Catch Docker-specific issues early
- ✅ Test the complete stack (app + PostgreSQL + Redis) in isolation

## Prerequisites

- Docker Desktop installed and running
- `.env.docker` file configured (see setup below)

## Quick Start

### 1. Create Local Docker Configuration

```bash
# Copy the example file
cp .env.docker.example .env.docker

# Generate a secure auth secret
openssl rand -base64 32

# Edit .env.docker and add your settings
# At minimum, set BETTER_AUTH_SECRET to the generated value
```

### 2. Build and Start Services

```bash
# Build and start all services (app, PostgreSQL, Redis)
docker compose up --build

# Or run in detached mode (background)
docker compose up --build -d
```

### 3. Access the Application

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5432 (user: `techhub`, password: `techhub_local_password`, db: `techhub`)
- **Redis**: localhost:6379

### 4. View Logs

```bash
# Follow app logs
docker compose logs app -f

# View all logs
docker compose logs -f

# View specific service
docker compose logs postgres -f
```

### 5. Stop Services

```bash
# Stop and remove containers (keeps data volumes)
docker compose down

# Stop and remove everything including volumes (fresh start)
docker compose down -v
```

## Configuration

### Environment Variables

The `docker-compose.yml` uses `.env.docker` for configuration. Key variables:

```bash
# Required
BETTER_AUTH_SECRET=your-secret-here    # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# Optional
OPENAI_API_KEY=sk-...                  # Only needed for AI features
LOG_LEVEL=info                         # debug, info, warn, error
```

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
git pull origin dev
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

**Cause**: Another process is using port 3000, 5432, or 6379.

**Solution**: Stop the conflicting service:
```bash
# If running native dev server
# Stop it before starting Docker

# Or modify docker-compose.yml ports:
ports:
  - "3001:3000"  # Use different host port
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

## Comparison: Native vs Docker Development

| Aspect | Native Dev | Local Docker |
|--------|------------|--------------|
| **Startup Time** | Fast (~5s) | Slow (~2-3min first build) |
| **Hot Reload** | Yes (Turbopack) | No (requires rebuild) |
| **Resource Usage** | Light | Heavy (multi-container) |
| **Isolation** | Shared system | Fully isolated |
| **Production Parity** | Medium | High (same as K8s) |
| **Best For** | Daily development | Testing deployments |

**Recommendation**: Use native dev (`npm run dev`) for daily work, Docker for testing deployments before pushing to GitLab.

## CI/CD Integration

The same Dockerfile is used in GitLab CI with these overrides:

```yaml
# .gitlab-ci.yml
/kaniko/executor \
  --build-arg BASE_REGISTRY=jed.ocir.io/axbp9ow0rohq \
  --build-arg NEXT_PUBLIC_APP_VERSION=${version} \
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
