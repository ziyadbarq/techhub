# TechHub CI/CD Build Steps

Complete reference for all build steps executed in the GitLab CI/CD pipeline following Barq's standard GitOps pattern.

## Pipeline Overview

**Repository**: http://gitlab.dev.baraq.com.internal/baraq-engineering/webdev/techhub
**Pipeline Duration**: ~15-20 minutes (with cache) | ~25-30 minutes (cold start)
**Target Platforms**: OCI Cloud (main branch) | GCP Cloud (dev branch)
**Deployment Method**: GitOps via ArgoCD (CI updates values.yaml, ArgoCD deploys)

## Pipeline Stages

### Stage 1: Validation (~2-3 minutes)

**Purpose**: Validate code quality through type-checking, linting, and unit tests

**Job**: `validate`
**Runs on**: All commits to `main` and `dev` branches, web triggers
**Runner**: `ocinode18` (OCI runner)
**Image**: `gitlab-runner-node-18-alpine`

**Commands**:

```bash
# Copy .npmrc for private registry access
cp /.npmrc .

# Install dependencies (reproducible builds)
npm ci --prefer-offline --cache $NPM_CACHE_DIR

# Generate Prisma client (required for TypeScript)
npm run db:generate

# Run validation checks
npm run type-check  # TypeScript compilation check
npm run lint        # ESLint validation
npm run test -- --run --reporter=verbose  # Vitest unit tests
```

**Outputs**:

- Code coverage report (Cobertura format)
- Coverage artifacts (30-day retention)

**Caching**:

- Cache key: `validate-${CI_COMMIT_REF_SLUG}`
- Cached paths: `node_modules/`, `.npm/`
- Policy: `pull-push` (read and update cache)

**Duration**:

- With cache: ~2 minutes
- Without cache: ~3 minutes

---

### Stage 2a: Build Only - OCI (Manual Web Trigger)

**Purpose**: Build Docker image for OCI registry without deployment

**Job**: `build-oci`
**Trigger**: Manual web trigger with `type=build_only` and `CLOUD=oci`
**Runner**: `ocinode18`
**Timeout**: 20 minutes

**Dockerfile Source**:

- Cloned from deployment-configs repo
- Uses: `dockerfiles/nodejs-Dockerfile-optimize`
- Entrypoint: `dockerfiles/nodejs-entrypoint.sh`

**Build Process**:

```bash
# Clone deployment-configs for standardized Dockerfile
git clone --depth 1 http://${GITLAB_UN}:${GITLAB_TOKEN}@gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs.git
cp deployment-configs/dockerfiles/nodejs-Dockerfile-optimize ./Dockerfile-build
cp deployment-configs/dockerfiles/nodejs-entrypoint.sh .
cp /.npmrc .

# Install dependencies
npm ci --prefer-offline --cache $NPM_CACHE_DIR
npm run db:generate

# Build Next.js application
npm run build

# Generate release version from tags + conventional commits
git fetch --tags --force
git fetch --unshallow || true
eval "$(node scripts/release/compute-version.mjs --format=env)"
version="${APP_VERSION}"
commit_id=`git rev-parse --short=8 HEAD`
export IMAGE_TAG="${version}-${commit_id}-${CI_JOB_ID}"
export FULL_IMAGE_NAME="${DEV_CNTNR_OCI_REG_IMG_PREFIX}/${PROJECT}:${IMAGE_TAG}"

# Build with Kaniko (daemonless Docker builder)
/kaniko/executor \
  --context $CI_PROJECT_DIR \
  --dockerfile Dockerfile-build \
  --destination ${FULL_IMAGE_NAME}
```

**Image Tag Format**: `{version}-{commit_id}-{CI_JOB_ID}`

- Example: `1.0.0-a3f5c2-123456`
- version: CI-calculated semver from release tags plus conventional commits
- commit_id: short Git commit hash (6 chars)
- CI_JOB_ID: GitLab job ID for traceability

**Build Metadata**: CI also bakes `APP_VERSION`, `GIT_COMMIT`, `GIT_COMMIT_FULL`, `GIT_REF`, `BUILD_DATE`, `IMAGE_TAG`, `PIPELINE_ID`, `PIPELINE_URL`, and `PROJECT_URL` into the runtime image. The `/health` page reads those values directly from the running container.

**Registry**: `jed.ocir.io/axbp9ow0rohq/techhub`

**Duration**: ~8-10 minutes

---

### Stage 2b: Build Only - GCP (Manual Web Trigger)

**Purpose**: Build Docker image for GCP registry without deployment

**Job**: `build-gcp`
**Trigger**: Manual web trigger with `type=build_only` and `CLOUD=gcp`
**Runner**: `globalnodegcp`
**Timeout**: 20 minutes

**Dockerfile Source**:

- Uses: `dockerfiles/nodejs-gcp-Dockerfile-optimize` (GCP-optimized variant)

**Process**: Same as OCI build but with GCP-specific configuration:

- Registry: `me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/techhub`
- Additional sysctl tuning for GCP runners

**Duration**: ~8-10 minutes

---

### Stage 3a: Build and Deploy - OCI (GitOps)

**Purpose**: Build image, push to registry, update ArgoCD values for automatic deployment

**Job**: `build-and-push-oci-to-argo`
**Trigger**:

- Automatic: Push to `main` branch
- Manual: Web trigger with `type=build_and_deploy` and `CLOUD=oci`

**Runner**: `ocinode18`
**Timeout**: 20 minutes

**GitOps Workflow**:

```bash
# 1. Build Docker image with Kaniko (same as Stage 2a)
/kaniko/executor \
  --context $CI_PROJECT_DIR \
  --dockerfile Dockerfile-build \
  --destination ${FULL_IMAGE_NAME}

# 2. Clone deployment-configs repository
cd /tmp
git clone http://${GITLAB_UN}:${GITLAB_TOKEN}@gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs.git
cd deployment-configs

# Configure git
git config user.email "gitlab-ci@baraq.com"
git config user.name "GitLab CI"

# 3. Update values.yaml with new image tag (GitOps pattern)
# Install yq (YAML processor)
wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
chmod +x /usr/local/bin/yq

# Update image name in values-dev.yaml
export IMAGE_NAME="${DEV_CNTNR_OCI_REG_IMG_PREFIX}/${PROJECT}:${IMAGE_TAG}"

yq e -i ".deployment.imageName = strenv(IMAGE_NAME)" manifests/${PROJECT}/${DEV_OCI_VALUES}

# 4. Commit and push changes to trigger ArgoCD sync
git add manifests/${PROJECT}/${DEV_OCI_VALUES}
git commit -m "🚀 Update ${PROJECT} DEV image to ${IMAGE_TAG}"
git push github -o ci.skip HEAD:main
```

**Key Concepts**:

- **GitOps**: CI only updates configuration (values.yaml), ArgoCD handles deployment
- **ArgoCD**: Monitors deployment-configs repo and automatically syncs changes to Kubernetes
- **Separation of Concerns**: Build pipeline doesn't need kubectl/helm access
- **Prisma Migrations**: Run unconditionally on pod startup inside `docker-start.mjs` — no UI flag, no separate K8s Job
- **Release Tagging**: Successful `main` deployments create the next `vX.Y.Z` Git tag automatically, using the CI-calculated version

**Values File**: `manifests/techhub/values-dev.yaml`
**Namespace**: `istio-dev`
**URL**: https://techhub.baraq.com

**Duration**: ~10-12 minutes

---

### Stage 3b: Build and Deploy - GCP (GitOps)

**Purpose**: Build image for GCP and update ArgoCD values for automatic deployment

**Job**: `build-and-push-gcp-to-argo`
**Trigger**:

- Automatic: Push to `dev` branch
- Manual: Web trigger with `type=build_and_deploy` and `CLOUD=gcp`

**Process**: Same GitOps workflow as OCI but with GCP-specific configuration:

- Values file: `manifests/techhub/values-gcpdev.yaml`
- Namespace: `horizontal-services`
- Registry: GCP Artifact Registry
- URL: https://techhub.dev.barq.com

**Duration**: ~10-12 minutes

---

### Stage 4: Image Promotion (Manual)

**Purpose**: Promote existing dev images to higher environments without rebuilding

**Jobs**:

- `promote-to-uat-oci` - Promote to UAT (OCI)
- `promote-to-test-oci` - Promote to TEST (OCI)
- `promote-to-perf-oci` - Promote to PERF (OCI)
- `promote-to-uat-gcp` - Promote to UAT (GCP)

**Trigger**: Manual (requires DevOps approval)
**Input**: Image tag from previous stage (e.g., `1.0.0-a3f5c2-123456`)

**Process**:

```bash
# No rebuild - just update values.yaml for target environment
yq e -i ".deployment.imageName = strenv(IMAGE_NAME)" manifests/${PROJECT}/${TARGET_VALUES}
git commit -m "🚀 Promote ${PROJECT} to ${ENVIRONMENT}: ${IMAGE_TAG}"
git push github -o ci.skip HEAD:main
```

**Benefits**:

- Same image promotes through environments (immutable)
- No rebuilds = faster, safer deployments
- Reduces drift between environments
- Audit trail via Git commits

**Duration**: ~1-2 minutes per promotion

---

## Build Artifacts and Outputs

### Docker Image

**Base Image**: `node:18-alpine` (via deployment-configs Dockerfile)
**Build Type**: Multi-stage (deps → builder → runner)
**Output Mode**: Next.js standalone (enabled in `next.config.ts`)

**Image Contents**:

- Node.js runtime
- Next.js standalone server
- `.next/standalone/` - Self-contained server
- `.next/static/` - Static assets
- `public/` - Public assets
- `node_modules/` (production only)
- Prisma client (generated)

**Image Size**: ~250-350MB (Alpine-based)

**Image Layers**:

1. System dependencies (Alpine packages)
2. Node.js dependencies (npm ci)
3. Prisma client generation
4. Next.js build output
5. Production runtime configuration

### Image Tagging Strategy

**Format**: `{version}-{commit_id}-{CI_JOB_ID}`

**Example**: `1.0.0-a3f5c2-123456`

**Components**:

- **version**: From `package.json` (e.g., `1.0.0`)
- **commit_id**: Git short SHA (6 chars, e.g., `a3f5c2`)
- **CI_JOB_ID**: GitLab job ID (e.g., `123456`)

**Benefits**:

- Traceability: Links image to specific code version and CI job
- Immutability: Same image promoted through environments
- Debugging: Easy to identify exact build

---

## Environment Variables

### UI-Selectable Variables (GitLab Web Interface)

**type**: Operation mode

- `build_only` - Build image without deployment
- `build_and_deploy` - Build + update ArgoCD values

**CLOUD**: Target cloud platform

- `oci` - Oracle Cloud Infrastructure
- `gcp` - Google Cloud Platform

> **Prisma migrations**: There is no UI flag. Migrations run automatically at pod startup in `docker-start.mjs` before the Next.js server accepts traffic.

### Pipeline Variables (Configured in .gitlab-ci.yml)

**Project Configuration**:

- `PROJECT`: `techhub`
- `AUTOMATIC_TRIGGER_BRANCH`: `main`
- `DEV_BRANCH`: `dev`

**OCI Configuration**:

- `DEV_CNTNR_OCI_REG_IMG_PREFIX`: `jed.ocir.io/axbp9ow0rohq`
- `DEV_OCI_LAB_TAG`: `ocinode18`
- `DEV_OCI_VALUES`: `values-dev.yaml`
- `DEV_OCI_IMAGE`: `jed.ocir.io/axbp9ow0rohq/gitlab-runner-node-18-alpine`

**GCP Configuration**:

- `DEV_CNTNR_GCP_REG_IMG_PREFIX`: `me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo`
- `DEV_GCP_LAB_TAG`: `globalnodegcp`
- `DEV_GCP_VALUES`: `values-gcpdev.yaml`
- `DEV_GCP_IMAGE`: `me-central2-docker.pkg.dev/.../gitlab-runner-node-18-alpine:latest`

### GitLab CI/CD Secrets (Set by DevOps)

**Required Variables**:

- `GITLAB_UN` - GitLab username for cloning deployment-configs
- `GITLAB_TOKEN` - GitLab access token

**Optional Variables** (if using notifications):

- `PUSHOVER_API_TOKEN` - Pushover app token
- `PUSHOVER_USER_KEY` - Pushover user key

### Runtime Variables (Spring Cloud Config + Kubernetes)

Managed in backend-configs and, for the current hybrid split, selected
Kubernetes Secrets/ConfigMaps:

- `DATABASE_URL` - PostgreSQL connection (GCP Cloud SQL)
- `REDIS_URL` - Redis connection (GCP Memorystore)
- `BETTER_AUTH_URL` - Canonical external app origin for Better Auth redirects and links
- `NEXT_PUBLIC_APP_URL` - Same canonical external app origin, also required at build time because it is embedded in the client bundle
- `TRUSTED_ORIGINS` - Optional comma-separated extra browser origins
- `ENCRYPTION_KEY` - AES-256-GCM encryption key
- `MICROSOFT_*` - Azure AD/Graph API credentials
- `AZURE_*` - Intune integration credentials
- `PORT` - Application port (default: 3000)
- `CONFIG_SERVER_URL` - Bootstrap URL for Spring Cloud Config, including scheme
- `APPLICATION_NAME` - `techhub`
- `ENVIRONMENT_NAME` - `gcpdev` for GCP dev, `dev` for OCI dev

**Reference**: http://gitlab.dev.baraq.com.internal/baraq-engineering/backend-shared/backend-configs

---

## Deployment Flow Diagram

```
┌─────────────────┐
│ Git Push        │
│ (main/develop)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Stage 1: Validate (2-3 min)        │
│ - npm ci                            │
│ - Prisma generate                   │
│ - Type-check + Lint + Unit Tests    │
└────────┬────────────────────────────┘
         │
         ▼
    ┌───────────┐
    │ Success?  │
    └─────┬─────┘
          │ Yes
          ▼
┌─────────────────────────────────────┐
│ Stage 2: Build Only (manual)       │
│ OR                                  │
│ Stage 3: Build and Deploy (auto)   │
└────────┬────────────────────────────┘
         │
         ├─── Build Only (manual web trigger)
         │    ├─ build-oci: Build for OCI
         │    └─ build-gcp: Build for GCP
         │
         └─── Build and Deploy (automatic)
              ├─ build-and-push-oci-to-argo (main branch)
              │  ├─ Build with Kaniko
              │  ├─ Push to OCI registry
              │  ├─ Update values-dev.yaml
              │  └─ ArgoCD syncs to K8s
              │
              └─ build-and-push-gcp-to-argo (dev branch)
                 ├─ Build with Kaniko
                 ├─ Push to GCP registry
                 ├─ Update values-gcpdev.yaml
                 └─ ArgoCD syncs to K8s
         │
         ▼
┌─────────────────────────────────────┐
│ Stage 4: Image Promotion (manual)  │
│ - promote-to-uat-oci                │
│ - promote-to-test-oci               │
│ - promote-to-perf-oci               │
│ - promote-to-uat-gcp                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Deployed! ✅     │
│ ArgoCD synced   │
└─────────────────┘
```

---

## Total Pipeline Duration

| Stage          | Job                       | Duration (Cached) | Duration (Cold) |
| -------------- | ------------------------- | ----------------- | --------------- |
| Validate       | validate                  | 2 min             | 3 min           |
| Build Only     | build-oci / build-gcp     | 8 min             | 10 min          |
| Build & Deploy | build-and-push-\*-to-argo | 10 min            | 12 min          |
| Promotion      | promote-to-\*             | 1 min             | 1 min           |

**Typical Workflows**:

- **Development (auto-deploy)**: validate (2m) + build-and-push-gcp (10m) = **~12 minutes**
- **Production (manual trigger)**: validate (2m) + build-and-push-oci (10m) = **~12 minutes**
- **Manual build only**: validate (2m) + build-oci/gcp (8m) = **~10 minutes**
- **Promotion**: promote-to-uat (1m) = **~1 minute**

---

## Branch Strategy

| Branch           | Cloud | Registry              | Environment | Namespace             | Deployment Trigger                     |
| ---------------- | ----- | --------------------- | ----------- | --------------------- | -------------------------------------- |
| `main`           | OCI   | OCI Registry          | Production  | `istio-dev`           | Automatic (build-and-push-oci-to-argo) |
| `dev`            | GCP   | GCP Artifact Registry | Development | `horizontal-services` | Automatic (build-and-push-gcp-to-argo) |
| Feature branches | -     | -                     | -           | -                     | Validation only                        |

**Notes**:

- `main` branch: Production-ready code, automatically builds and updates ArgoCD
- `dev` branch: Development code, automatically builds and updates ArgoCD
- Feature branches: Run validation only (no builds or deployments)

---

## Key Technologies

### Kaniko

**Purpose**: Daemonless Docker image builder for Kubernetes
**Why**: Works in GitLab runners without Docker daemon, more secure
**Command**: `/kaniko/executor --context $CI_PROJECT_DIR --dockerfile Dockerfile-build --destination {image}`

### yq

**Purpose**: YAML processor for updating values.yaml
**Why**: Programmatic updates to Helm values files
**Command**: `yq e -i ".deployment.imageName = strenv(IMAGE_NAME)" values.yaml`

### ArgoCD

**Purpose**: GitOps continuous delivery for Kubernetes
**Why**: Declarative, automated, auditable deployments
**How**: Monitors deployment-configs repo, syncs changes to K8s clusters

### Next.js Standalone Output

**Purpose**: Self-contained server output for Docker
**Why**: Smaller images, faster builds, production-optimized
**Config**: `output: "standalone"` in `next.config.ts`

---

## Comparison: Old vs New Pipeline

### Old Pipeline (SSH-based)

- Direct kubectl/helm commands in CI
- Pipeline needs K8s credentials
- No promotion workflow
- Separate build and deploy stages
- Docker build with daemon

### New Pipeline (GitOps)

- CI updates values.yaml, ArgoCD deploys
- Pipeline only needs Git access
- Immutable image promotion
- Combined build-and-deploy stages
- Kaniko (daemonless builds)
- Follows Barq's standard pattern

---

## Related Documentation

- [GITLAB_CI_SETUP.md](GITLAB_CI_SETUP.md) - Setup and configuration guide
- [KUBERNETES_OPERATIONS.md](KUBERNETES_OPERATIONS.md) - Day-to-day K8s operations
- **Deployment Configs**: http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs
- **Backend Configs**: http://gitlab.dev.baraq.com.internal/baraq-engineering/backend-shared/backend-configs
- **GitLab Repository**: http://gitlab.dev.baraq.com.internal/baraq-engineering/webdev/techhub
