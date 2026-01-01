# TechHub CI/CD Build Steps

Complete reference for all build steps executed in the GitLab CI/CD pipeline.

## Pipeline Overview

**Repository**: http://gitlab.dev.baraq.com.internal/baraq-engineering/webdev/techhub
**Pipeline Duration**: ~18-22 minutes (with cache) | ~28-32 minutes (cold start)
**Target Platforms**: OCI Cloud (production) | GCP Cloud (development)

## Build Stages

### Stage 1: Install Dependencies (~1-3 minutes)

**Purpose**: Install Node.js dependencies and generate Prisma client

**Commands**:
```bash
# Install system dependencies for native modules
apk add --no-cache python3 make g++

# Install Node.js dependencies (reproducible builds)
npm ci --cache .npm --prefer-offline --include=dev

# Generate Prisma client (required for TypeScript and build)
npm run db:generate
```

**Outputs**:
- `node_modules/` - All dependencies
- `src/generated/prisma/` - Prisma client

**Caching**:
- Cache key: Based on `package-lock.json` hash
- Cached paths: `node_modules/`, `.npm/`
- Cache invalidation: Automatic when dependencies change

**Duration**:
- With cache: ~1 minute
- Without cache: ~3 minutes

---

### Stage 2: Code Validation (~2 minutes, parallel execution)

**Purpose**: Validate code quality through parallel checks

#### Job 2a: Type-Check (~1-2 minutes)
```bash
npm run type-check
```
- Runs TypeScript compiler in check mode
- Validates type safety across entire codebase
- No JavaScript output generated

#### Job 2b: Lint (~30 seconds - 1 minute)
```bash
npm run lint
```
- Runs ESLint validation
- Checks code style and best practices
- Enforces import rules and architectural boundaries

#### Job 2c: Unit Tests (~1-2 minutes)
```bash
npm run test -- --run --reporter=verbose
```
- Runs Vitest unit tests
- Generates code coverage reports
- Coverage exported to Cobertura format

**Parallelization**: All three jobs run simultaneously
**Total Duration**: ~2 minutes (limited by slowest job)

---

### Stage 3: Application Build (~3-5 minutes)

**Purpose**: Build production Next.js application

**Environment Variables**:
```bash
# Mock DATABASE_URL (Prisma client initialization only)
DATABASE_URL="postgresql://build:build@localhost:5432/build"
REDIS_URL="redis://localhost:6379"
SKIP_TYPE_CHECK="true"  # Already type-checked in previous stage
NODE_ENV="production"
```

**Commands**:
```bash
npm run build:fast
```

**What Happens**:
1. Next.js compiles React components to optimized JavaScript
2. Server-side rendering (SSR) code bundled
3. Static assets optimized and fingerprinted
4. Standalone server output generated (for Docker)

**Outputs**:
- `.next/` - Complete build output
- `.next/standalone/` - Standalone server (for Docker)
- `.next/static/` - Static assets
- `public/` - Public assets

**Caching**:
- Cache key: Branch-specific
- Cached paths: `.next/cache/` (incremental builds)

**Duration**:
- With cache: ~3 minutes
- Without cache: ~5 minutes

---

### Stage 4: Integration Tests (~2-4 minutes)

**Purpose**: Test with real database and cache services

**Services Started**:
```yaml
services:
  - postgres:16-alpine  # PostgreSQL database
  - redis:7-alpine      # Redis cache
```

**Environment Variables**:
```bash
DATABASE_URL="postgresql://test:test@postgres:5432/test"
REDIS_URL="redis://redis:6379"
```

**Pre-Test Setup**:
```bash
# Install PostgreSQL client
apk add --no-cache postgresql-client

# Wait for PostgreSQL readiness
until PGPASSWORD=test psql -h postgres -U test -d test -c '\q'; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Run database migrations on test database
npx dotenv -e .env.local -- prisma migrate deploy || true
```

**Test Execution**:
```bash
npm run test -- --run --reporter=verbose tests/use-cases/ tests/di/
```

**What's Tested**:
- Use case business logic with real database
- Dependency injection container resolution
- Repository implementations with Prisma
- Database queries and transactions
- Redis caching functionality

**Duration**: 2-4 minutes (depends on test suite size)

---

### Stage 5: Docker Image Build (~3-5 minutes)

**Purpose**: Build and push Docker container images

#### 5a: OCI Registry (main branch → production)

**Login**:
```bash
echo "$OCI_REGISTRY_PASSWORD" | docker login -u "$OCI_REGISTRY_USERNAME" --password-stdin $OCI_REGISTRY
```

**Build**:
```bash
docker build \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_PUBLIC_APP_VERSION=$CI_COMMIT_SHORT_SHA \
  -t $OCI_REGISTRY/techhub:$CI_COMMIT_SHORT_SHA \
  -t $OCI_REGISTRY/techhub:latest \
  -f Dockerfile .
```

**Push**:
```bash
docker push $OCI_REGISTRY/techhub:$CI_COMMIT_SHORT_SHA
docker push $OCI_REGISTRY/techhub:latest
```

#### 5b: GCP Registry (develop branch → development)

**Login**:
```bash
echo "$GCP_SERVICE_ACCOUNT_KEY" | docker login -u _json_key --password-stdin $GCP_REGISTRY
```

**Build & Push**: Same as OCI but to GCP registry

**Dockerfile Multi-Stage Build**:
1. **Stage 1 (deps)**: Install dependencies
2. **Stage 2 (builder)**: Build Next.js application
3. **Stage 3 (runner)**: Create minimal production image

**Image Size**: ~200-300MB (Alpine-based, standalone output)

**Duration**: 3-5 minutes (depends on layer caching)

---

### Stage 6: Kubernetes Deployment (~2-3 minutes)

**Purpose**: Deploy to Kubernetes using Helm

#### 6a: Deploy to OCI Production (main branch, manual trigger)

**Environment**:
- Cloud: OCI
- Namespace: `istio-dev`
- URL: https://techhub.baraq.com
- Trigger: Manual

**Setup**:
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && mv kubectl /usr/local/bin/

# Configure kubeconfig
echo "$KUBECONFIG_CONTENT" > ~/.kube/config
chmod 600 ~/.kube/config

# Verify connection
kubectl cluster-info
```

**Clone Deployment Configs**:
```bash
git clone http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs.git
cd deployment-configs
```

**Helm Deploy**:
```bash
helm upgrade --install techhub ./manifests/techhub \
  --namespace istio-dev \
  --values manifests/techhub/values-oci-prod.yaml \
  --set image.tag=$CI_COMMIT_SHORT_SHA \
  --set image.repository=$OCI_REGISTRY/techhub \
  --wait \
  --timeout 5m
```

**Verification**:
```bash
kubectl rollout status deployment/techhub -n istio-dev
kubectl get pods -n istio-dev -l app=techhub
```

**Notifications**:
```bash
# Send Pushover notification on success/failure
curl -s --form-string "token=$PUSHOVER_API_TOKEN" \
  --form-string "user=$PUSHOVER_USER_KEY" \
  --form-string "title=TechHub Deployment Success (OCI)" \
  --form-string "message=✅ Deployed $CI_COMMIT_SHORT_SHA to OCI Kubernetes" \
  https://api.pushover.net/1/messages.json
```

#### 6b: Deploy to GCP Development (develop branch, automatic)

**Environment**:
- Cloud: GCP
- Namespace: `horizontal-services`
- URL: https://techhub-dev.baraq.com
- Trigger: Automatic on successful build

**Deployment**: Same process as OCI but with GCP values and automatic trigger

---

## Environment Variables

### Build-Time Variables (Set in GitLab CI)

**Docker Registry (OCI)**:
- `OCI_REGISTRY_URL` - OCI container registry URL
- `OCI_REGISTRY_USERNAME` - Registry username
- `OCI_REGISTRY_PASSWORD` - Registry password (masked)

**Docker Registry (GCP)**:
- `GCP_REGISTRY_URL` - GCP container registry URL
- `GCP_SERVICE_ACCOUNT_KEY` - Service account JSON key (masked)

**Kubernetes**:
- `KUBECONFIG_CONTENT` - Kubernetes config file content (protected, masked)

**Notifications**:
- `PUSHOVER_API_TOKEN` - Pushover app token (masked)
- `PUSHOVER_USER_KEY` - Pushover user key (masked)

### Runtime Variables (Stored in backend-configs repo)

**Reference**: http://gitlab.dev.baraq.com.internal/baraq-engineering/backend-shared/backend-configs

Runtime environment variables are stored in the backend-configs repository and injected into Kubernetes pods via ConfigMaps/Secrets:

- `DATABASE_URL` - PostgreSQL connection (GCP Cloud SQL)
- `REDIS_URL` - Redis connection (GCP Memorystore)
- `ENCRYPTION_KEY` - AES-256-GCM key
- `MICROSOFT_*` - Azure AD/Graph API credentials
- `AZURE_*` - Intune integration credentials
- `OPENAI_API_KEY` - AI features (if enabled)
- `PORT` - Application port (default: 3000)

---

## Deployment Flow Diagram

```
┌─────────────┐
│ Git Push    │
│ (main/dev)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Stage 1: Install Dependencies (1-3 min)    │
│ - npm ci                                    │
│ - Generate Prisma client                   │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Stage 2: Validate (parallel, ~2 min)       │
│ ├─ Type-check (TypeScript)                 │
│ ├─ Lint (ESLint)                           │
│ └─ Unit Tests (Vitest)                     │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Stage 3: Build (3-5 min)                   │
│ - Next.js production build                 │
│ - Generate standalone server               │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Stage 4: Integration Tests (2-4 min)       │
│ - Start PostgreSQL + Redis                 │
│ - Run use-case tests                       │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Stage 5: Docker Build (3-5 min)            │
│ - Multi-stage Dockerfile                   │
│ - Push to OCI/GCP registry                 │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Stage 6: Kubernetes Deploy (2-3 min)       │
│ - Clone deployment-configs                 │
│ - Helm upgrade --install                   │
│ - Verify rollout status                    │
│ - Send Pushover notification               │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│ Deployed! ✅ │
└─────────────┘
```

---

## Total Pipeline Duration

| Stage | Duration (Cached) | Duration (Cold) |
|-------|-------------------|-----------------|
| Install | 1 min | 3 min |
| Validate | 2 min | 2 min |
| Build | 3 min | 5 min |
| Test | 3 min | 4 min |
| Docker | 4 min | 5 min |
| Deploy | 3 min | 3 min |
| **Total** | **16 min** | **22 min** |

**With parallel jobs and caching**: 18-22 minutes average

---

## Branch Strategy

| Branch | Registry | Environment | Namespace | Deployment |
|--------|----------|-------------|-----------|------------|
| `main` | OCI | Production | `istio-dev` | Manual trigger |
| `develop` | GCP | Development | `horizontal-services` | Automatic |
| Feature branches | - | - | - | Tests only |

---

## Related Documentation

- [GITLAB_CI_SETUP.md](GITLAB_CI_SETUP.md) - Setup and configuration guide
- [PIPELINE_ARCHITECTURE.md](PIPELINE_ARCHITECTURE.md) - Technical architecture details
- [DEPLOYMENT_PLAYBOOK.md](DEPLOYMENT_PLAYBOOK.md) - Operations and troubleshooting
