# GitLab CI/CD Setup Guide

Complete setup instructions for the TechHub GitLab CI/CD pipeline using GitOps with ArgoCD deployment to Kubernetes.

**Related Documentation**:
- [CI Optimization Summary](../../CI_OPTIMIZATION_SUMMARY.md) - Caching, branch automation, error detection
- [CI Monitoring Summary](../../CI_MONITORING_SUMMARY.md) - Metrics tracking, Prisma validation
- [CI Build Fix Summary](../../CI_BUILD_FIX_SUMMARY.md) - Logger initialization and recent fixes

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Steps](#setup-steps)
  - [1. Configure GitLab CI/CD Variables](#1-configure-gitlab-cicd-variables)
  - [2. Set Up Helm Values in Deployment-Configs](#2-set-up-helm-values-in-deployment-configs)
  - [3. Configure ArgoCD Applications](#3-configure-argocd-applications)
  - [4. Enable the Pipeline](#4-enable-the-pipeline)
- [Testing the Pipeline](#testing-the-pipeline)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the GitLab CI/CD pipeline, ensure you have:

1. **GitLab Account** with Maintainer role on repositories:
   - **TechHub Repository**: http://gitlab.dev.baraq.com.internal/baraq-engineering/webdev/techhub
   - **Deployment-Configs Repository**: http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs

2. **GitLab Runners** (configured by DevOps team):
   - **OCI Runner**: Tagged with `ocinode18`
   - **GCP Runner**: Tagged with `globalnodegcp`
   - Both runners have Kaniko executor pre-installed
   - Both runners have authenticated access to respective container registries

3. **ArgoCD** (configured by DevOps team):
   - Monitoring deployment-configs repository
   - Auto-sync enabled for dev environments
   - Access to target Kubernetes clusters:
     - **OCI**: namespace `istio-dev`
     - **GCP**: namespace `horizontal-services`

4. **Container Registries** (authentication configured on runners):
   - **OCI Registry**: `jed.ocir.io/axbp9ow0rohq`
   - **GCP Registry**: `me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo`

5. **Backend-Configs Repository** (optional, for runtime environment variables):
   - http://gitlab.dev.baraq.com.internal/baraq-engineering/backend-shared/backend-configs

## Setup Steps

### 1. Configure GitLab CI/CD Variables

Navigate to your GitLab project:

**Settings** > **CI/CD** > **Variables** > **Add variable**

#### Required Variables

| Key | Value | Type | Protected | Masked | Description |
|-----|-------|------|-----------|--------|-------------|
| `GITLAB_UN` | `<gitlab-username>` | Variable | ✅ | ✅ | GitLab username for cloning deployment-configs |
| `GITLAB_TOKEN` | `<gitlab-access-token>` | Variable | ✅ | ✅ | GitLab personal access token with `read_repository` and `write_repository` scopes |

**How to create GitLab Access Token**:
1. Go to GitLab > **User Settings** > **Access Tokens**
2. Create token with:
   - **Name**: `techhub-ci-deployment`
   - **Scopes**: `read_repository`, `write_repository`
   - **Expiration**: Set appropriate expiration (90-365 days)
3. Copy token immediately (shown only once)

#### Optional Variables (Notifications)

| Key | Value | Type | Protected | Masked | Description |
|-----|-------|------|-----------|--------|-------------|
| `PUSHOVER_API_TOKEN` | `<your-app-token>` | Variable | ❌ | ✅ | Pushover app token for deployment notifications |
| `PUSHOVER_USER_KEY` | `<your-user-key>` | Variable | ❌ | ✅ | Pushover user key |

**Get Pushover credentials**:
- **API Token**: https://pushover.net/apps/build (create new application)
- **User Key**: https://pushover.net (top right after login)

#### Variable Settings Explained

- **Protected**: Only available in protected branches (`main`, `develop`)
  - Use for deployment credentials
- **Masked**: Hidden in job logs (shows `[masked]` instead of value)
  - Use for all sensitive values (tokens, passwords)

**Important Notes**:
- Container registry authentication is handled by GitLab runners (Kaniko pre-configured)
- No Kubernetes credentials needed in CI (GitOps via ArgoCD)
- Pipeline only needs Git access to update deployment-configs

---

### 2. Set Up Helm Values in Deployment-Configs

#### Clone Deployment Configs Repository

```bash
git clone http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs.git
cd deployment-configs
```

#### Create Helm Values for TechHub

Create four values files for different environments:

**1. Development (OCI)** - `manifests/techhub/values-dev.yaml`:
```yaml
# Reference: manifests/auth-service/values-dev.yaml

deployment:
  replicaCount: 2
  imageName: jed.ocir.io/axbp9ow0rohq/techhub:1.0.0-abc123-456789  # Updated by CI
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3000
  targetPort: 3000

ingress:
  enabled: true
  className: istio
  hosts:
    - host: techhub.baraq.com
      paths:
        - path: /
          pathType: Prefix
  tls: []

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi

# Prisma migrations job (controlled by CI via npm_migration flag)
jobs:
  migrate:
    enabled: false  # Set to true by CI when npm_migration=true
    imageName: jed.ocir.io/axbp9ow0rohq/techhub:1.0.0-abc123-456789
    command: ["npx", "prisma", "migrate", "deploy"]

# Environment variables (reference backend-configs ConfigMaps/Secrets)
env:
  - name: NODE_ENV
    value: "production"
  - name: PORT
    value: "3000"

envFrom:
  - configMapRef:
      name: techhub-config
  - secretRef:
      name: techhub-secrets

# Health checks
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

**2. Development (GCP)** - `manifests/techhub/values-gcpdev.yaml`:
```yaml
# Similar to values-dev.yaml but for GCP

deployment:
  replicaCount: 1  # Lower for dev
  imageName: me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/techhub:1.0.0-abc123-456789
  pullPolicy: Always  # Always pull latest in dev

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  hosts:
    - host: techhub-dev.baraq.com
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 500m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi

jobs:
  migrate:
    enabled: false
    imageName: me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/techhub:1.0.0-abc123-456789

envFrom:
  - configMapRef:
      name: techhub-dev-config
  - secretRef:
      name: techhub-dev-secrets
```

**3. UAT (OCI)** - `manifests/techhub/values-uat.yaml`:
```yaml
# Copy from values-dev.yaml and adjust:
# - Higher resources
# - Different ingress host (techhub-uat.baraq.com)
# - Reference uat ConfigMaps/Secrets
```

**4. Test/Perf (OCI)** - `manifests/techhub/values-test.yaml` and `values-perf.yaml`:
```yaml
# Similar adjustments for test and perf environments
```

#### Commit Helm Values

```bash
git add manifests/techhub/
git commit -m "feat: Add TechHub Helm values for all environments"
git push origin main
```

---

### 3. Configure ArgoCD Applications

**Performed by DevOps team** - create ArgoCD Application resources for TechHub:

#### OCI Development Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: techhub-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs.git
    targetRevision: main
    path: manifests/techhub
    helm:
      valueFiles:
        - values-dev.yaml
  destination:
    server: https://oci-k8s-cluster-api
    namespace: istio-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

#### GCP Development Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: techhub-gcpdev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs.git
    targetRevision: main
    path: manifests/techhub
    helm:
      valueFiles:
        - values-gcpdev.yaml
  destination:
    server: https://gcp-k8s-cluster-api
    namespace: horizontal-services
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

Repeat for UAT, Test, Perf environments.

**ArgoCD will now**:
- Monitor deployment-configs repository for changes
- Automatically sync when `values-*.yaml` files are updated
- Deploy to Kubernetes clusters
- Handle Helm chart rendering

---

### 4. Enable the Pipeline

The pipeline is already configured in `.gitlab-ci.yml` and will run automatically.

**Pipeline Triggers**:

| Event | Stage | Action |
|-------|-------|--------|
| Push to `main` | `validate` | Run type-check, lint, tests |
| Push to `main` | `build_and_deploy` | Build image → Update values-dev.yaml → ArgoCD deploys |
| Push to `develop` | `validate` | Run validation |
| Push to `develop` | `build_and_deploy` | Build image → Update values-gcpdev.yaml → ArgoCD deploys |
| Web trigger (manual) | `build_only` | Build image only (no deployment) |
| Web trigger (manual) | `build_and_deploy` | Build + deploy to selected cloud |
| Manual job | `image-promotion` | Promote image to UAT/Test/Perf |

**UI-Selectable Variables** (Web triggers):

When manually triggering pipeline via GitLab UI:

1. **type**: Operation mode
   - `build_only` - Build Docker image without deployment
   - `build_and_deploy` - Build + update ArgoCD values

2. **CLOUD**: Target cloud platform
   - `oci` - Oracle Cloud Infrastructure
   - `gcp` - Google Cloud Platform

3. **npm_migration**: Prisma migration flag
   - `true` - Enable migrations (sets `jobs.migrate.enabled=true`)
   - `false` - Skip migrations (default)

---

## Testing the Pipeline

### 1. Verify GitLab Runners

Check that runners are available and healthy:

```bash
# In GitLab UI:
# Settings > CI/CD > Runners

# Look for:
# - Runner tagged with "ocinode18" (green status)
# - Runner tagged with "globalnodegcp" (green status)
```

### 2. Test Validation Stage

Create a feature branch and push:

```bash
git checkout -b test/pipeline-validation
git commit --allow-empty -m "test: Trigger pipeline validation"
git push origin test/pipeline-validation
```

**Expected**:
- Pipeline runs `validate` stage only
- Type-check, lint, and tests pass
- No build or deployment occurs

### 3. Test Automatic Deployment (Develop)

Push to `develop` branch:

```bash
git checkout develop
git merge test/pipeline-validation
git push origin develop
```

**Expected**:
1. `validate` stage passes (~2-3 min)
2. `build-and-push-gcp-to-argo` runs (~10-12 min):
   - Builds Docker image
   - Pushes to GCP registry
   - Updates `manifests/techhub/values-gcpdev.yaml`
   - Commits change to deployment-configs
3. ArgoCD detects change and syncs to GCP K8s cluster
4. New pods deployed in `horizontal-services` namespace

**Verify deployment**:
```bash
# Check ArgoCD UI
# https://argocd.baraq.com

# Or use kubectl (if you have access)
kubectl get pods -n horizontal-services -l app=techhub
kubectl get deployment techhub -n horizontal-services
```

### 4. Test Manual Build Trigger

Trigger pipeline manually via GitLab UI:

1. **CI/CD** > **Pipelines** > **Run pipeline**
2. Select branch: `main`
3. Set variables:
   - `type`: `build_only`
   - `CLOUD`: `oci`
   - `npm_migration`: `false`
4. Click **Run pipeline**

**Expected**:
- `validate` stage passes
- `build-oci` job runs
- Docker image built and pushed to OCI registry
- **No deployment** (values.yaml not updated)

### 5. Test Production Deployment (Main)

Push to `main` branch (or merge PR):

```bash
git checkout main
git merge develop
git push origin main
```

**Expected**:
1. `validate` stage passes
2. `build-and-push-oci-to-argo` runs:
   - Builds Docker image for OCI
   - Updates `manifests/techhub/values-dev.yaml`
3. ArgoCD syncs to OCI K8s cluster (`istio-dev` namespace)
4. Production deployment complete

**Verify**:
```bash
kubectl get pods -n istio-dev -l app=techhub
curl https://techhub.baraq.com/api/health
```

### 6. Test Image Promotion

After successful dev deployment, promote to UAT:

1. **CI/CD** > **Pipelines** > Select successful pipeline
2. Find `promote-to-uat-oci` job
3. Click **Play** button ▶️
4. Pipeline prompts for image tag (pre-filled from previous stage)
5. Click **Run job**

**Expected**:
- `promote-to-uat-oci` updates `values-uat.yaml` with dev image tag
- ArgoCD syncs to UAT environment
- Same image now running in UAT (no rebuild)

---

## Troubleshooting

### Issue 1: Pipeline Fails with "git clone failed"

**Symptoms**:
```
fatal: could not read Username for 'http://gitlab.dev.baraq.com.internal': No such device or address
```

**Causes**:
- Missing `GITLAB_UN` or `GITLAB_TOKEN` variables
- Token expired or has insufficient permissions
- Token doesn't have `read_repository` and `write_repository` scopes

**Solutions**:
1. Verify variables exist: **Settings** > **CI/CD** > **Variables**
2. Check token hasn't expired
3. Regenerate token with correct scopes:
   - `read_repository`
   - `write_repository`
4. Ensure variables are marked as **Protected** (available only in main/develop)

---

### Issue 2: Kaniko Build Fails

**Symptoms**:
```
error building image: error building stage: failed to execute command
```

**Causes**:
- Dockerfile syntax error (from deployment-configs)
- Missing Dockerfile in deployment-configs repo
- Incorrect Dockerfile path

**Solutions**:
1. Verify deployment-configs has Dockerfiles:
   ```bash
   git clone http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs.git
   ls -la deployment-configs/dockerfiles/
   # Should show: nodejs-Dockerfile-optimize, nodejs-gcp-Dockerfile-optimize
   ```

2. Test Dockerfile locally:
   ```bash
   docker build -f deployment-configs/dockerfiles/nodejs-Dockerfile-optimize .
   ```

3. Check .gitlab-ci.yml copies correct Dockerfile:
   ```yaml
   - cp deployment-configs/dockerfiles/nodejs-Dockerfile-optimize ./Dockerfile-build
   ```

---

### Issue 3: ArgoCD Not Syncing

**Symptoms**:
- CI pipeline succeeds
- values.yaml updated in deployment-configs
- But pods not updating in Kubernetes

**Causes**:
- ArgoCD Application not configured
- ArgoCD not monitoring deployment-configs repo
- ArgoCD sync disabled or manual

**Solutions**:
1. Check ArgoCD Application exists:
   ```bash
   kubectl get application techhub-dev -n argocd
   ```

2. Check ArgoCD UI:
   - https://argocd.baraq.com
   - Find TechHub application
   - Check sync status

3. Manual sync (if auto-sync disabled):
   ```bash
   argocd app sync techhub-dev
   ```

4. Verify ArgoCD monitoring correct repo:
   ```bash
   kubectl get application techhub-dev -n argocd -o yaml | grep repoURL
   # Should show: deployment-configs.git
   ```

---

### Issue 4: Image Tag Not Updating in values.yaml

**Symptoms**:
- Build succeeds
- But values.yaml shows old image tag
- Git commit not appearing in deployment-configs

**Causes**:
- `yq` command failed
- Git push failed (permissions)
- Git user not configured

**Solutions**:
1. Check job logs for `yq` errors:
   ```bash
   # In GitLab pipeline logs, look for:
   yq e -i ".deployment.imageName = strenv(IMAGE_NAME)" manifests/techhub/values-dev.yaml
   ```

2. Verify git config in pipeline:
   ```yaml
   script:
     - git config user.email "gitlab-ci@baraq.com"
     - git config user.name "GitLab CI"
   ```

3. Check git push output:
   ```bash
   git push origin -o ci.skip HEAD:main
   # Should show: branch main -> main
   ```

4. Verify `GITLAB_TOKEN` has `write_repository` scope

---

### Issue 5: Pods Crashing After Deployment

**Symptoms**:
```
kubectl get pods -n istio-dev
# Shows: CrashLoopBackOff or Error
```

**Causes**:
- Missing environment variables (ConfigMap/Secret)
- Database connection failed
- Redis connection failed
- Application startup error

**Solutions**:
1. Check pod logs:
   ```bash
   kubectl logs -n istio-dev -l app=techhub --tail=200
   ```

2. Verify ConfigMap/Secret exist:
   ```bash
   kubectl get configmap techhub-config -n istio-dev
   kubectl get secret techhub-secrets -n istio-dev
   ```

3. Check environment variables in pod:
   ```bash
   kubectl exec -it <pod-name> -n istio-dev -- env | grep DATABASE
   ```

4. Create ConfigMap/Secret from backend-configs:
   ```bash
   # See backend-configs repository for instructions
   # http://gitlab.dev.baraq.com.internal/baraq-engineering/backend-shared/backend-configs
   ```

---

### Issue 6: Prisma Migrations Not Running

**Symptoms**:
- Deployed successfully
- But database schema not updated
- Migration job pod not created

**Causes**:
- `npm_migration` variable set to `false`
- `jobs.migrate.enabled` not updated in values.yaml
- Migration job failed

**Solutions**:
1. Re-run pipeline with `npm_migration=true`:
   - **CI/CD** > **Pipelines** > **Run pipeline**
   - Set `npm_migration`: `true`

2. Verify values.yaml was updated:
   ```bash
   cat manifests/techhub/values-dev.yaml | grep -A 3 "jobs:"
   # Should show: enabled: true
   ```

3. Check migration job logs:
   ```bash
   kubectl get jobs -n istio-dev | grep techhub-migrate
   kubectl logs job/techhub-migrate -n istio-dev
   ```

4. Run migrations manually:
   ```bash
   kubectl exec -it <pod-name> -n istio-dev -- npx prisma migrate deploy
   ```

---

### Issue 7: Runner Not Picking Up Job

**Symptoms**:
- Pipeline stuck on "pending"
- Job waiting for runner

**Causes**:
- No runner with matching tag available
- Runner offline or busy
- Runner quota exceeded

**Solutions**:
1. Check runner status: **Settings** > **CI/CD** > **Runners**
2. Verify runner tags match job requirements:
   - OCI jobs need: `ocinode18`
   - GCP jobs need: `globalnodegcp`
3. Contact DevOps to:
   - Restart runner
   - Increase runner capacity
   - Check runner registration

---

## GitOps Workflow Summary

**Traditional CI/CD (Old)**:
```
CI Pipeline → kubectl apply / helm install → Kubernetes
```

**GitOps with ArgoCD (Current)**:
```
CI Pipeline → Update values.yaml → Git Push → ArgoCD Detects Change → Kubernetes
```

**Benefits**:
- **Declarative**: Desired state in Git
- **Auditable**: All changes tracked in Git history
- **Reversible**: Git revert to rollback
- **Secure**: CI doesn't need K8s credentials
- **Automated**: ArgoCD continuously syncs

---

## Next Steps

After successful setup:

1. **Monitor deployments**:
   - ArgoCD UI: https://argocd.baraq.com
   - Kubernetes dashboards
   - Application logs: `kubectl logs`

2. **Set up alerts** (optional):
   - ArgoCD Slack notifications
   - Prometheus alerts for pod health
   - Pushover notifications from CI

3. **Review operations guide**:
   - See [KUBERNETES_OPERATIONS.md](KUBERNETES_OPERATIONS.md) for day-to-day K8s management
   - See [BUILD_STEPS.md](BUILD_STEPS.md) for detailed pipeline reference

4. **Understand image promotion**:
   - Dev → UAT → Test → Perf
   - Immutable images (build once, promote many)
   - Manual approval gates

---

## Related Documentation

- [BUILD_STEPS.md](BUILD_STEPS.md) - Detailed build process and stages
- [KUBERNETES_OPERATIONS.md](KUBERNETES_OPERATIONS.md) - Day-to-day K8s operations
- **Deployment Configs**: http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs
- **Backend Configs**: http://gitlab.dev.baraq.com.internal/baraq-engineering/backend-shared/backend-configs
- **GitLab Repository**: http://gitlab.dev.baraq.com.internal/baraq-engineering/webdev/techhub
- **ArgoCD Docs**: https://argo-cd.readthedocs.io/en/stable/
