# GitLab CI/CD Setup Guide

Complete setup instructions for the TechHub GitLab CI/CD pipeline with Kubernetes deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Steps](#setup-steps)
  - [1. Configure Container Registries](#1-configure-container-registries)
  - [2. Configure Kubernetes Access](#2-configure-kubernetes-access)
  - [3. Configure GitLab CI/CD Variables](#3-configure-gitlab-cicd-variables)
  - [4. Set Up Helm Values](#4-set-up-helm-values)
  - [5. Enable the Pipeline](#5-enable-the-pipeline)
- [Testing the Pipeline](#testing-the-pipeline)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up the GitLab CI/CD pipeline, ensure you have:

1. **GitLab Account** with Maintainer role on the repository
   - Repository: http://gitlab.dev.baraq.com.internal/baraq-engineering/webdev/techhub
2. **Container Registry Access**:
   - OCI Registry credentials (for production deployments)
   - GCP Registry service account (for development deployments)
3. **Kubernetes Cluster Access**:
   - Kubeconfig with permissions to deploy to target namespaces
   - OCI namespace: `istio-dev`
   - GCP namespace: `horizontal-services`
4. **Pushover Account** for deployment notifications
   - API Token (create at https://pushover.net/apps/build)
   - User Key (found at https://pushover.net)
5. **Helm 3** installed locally for testing

## Setup Steps

### 1. Configure Container Registries

#### OCI Registry (Production)

**Obtain credentials from DevOps team**:
- Registry URL (e.g., `oci.registry.baraq.com`)
- Registry username
- Registry password

#### GCP Registry (Development)

**Obtain service account key from DevOps team**:
- Registry URL (e.g., `gcr.io/baraq-project`)
- Service account JSON key file

**Encode service account key** (if needed):
```bash
# The JSON key should be stored as-is in GitLab CI variable
cat service-account-key.json
```

### 2. Configure Kubernetes Access

#### Obtain Kubeconfig

**From DevOps team**, get kubeconfig with permissions to:
- OCI cluster: namespace `istio-dev`
- GCP cluster: namespace `horizontal-services`

#### Test Kubernetes Access

```bash
# Set kubeconfig
export KUBECONFIG=/path/to/kubeconfig

# Test OCI cluster access
kubectl cluster-info
kubectl get pods -n istio-dev

# Test GCP cluster access (if separate cluster)
kubectl get pods -n horizontal-services
```

### 3. Configure GitLab CI/CD Variables

Navigate to your GitLab project:

**Settings** > **CI/CD** > **Variables** > **Add variable**

Add the following variables:

#### Container Registry Variables (OCI)

| Key | Value | Type | Protected | Masked |
|-----|-------|------|-----------|--------|
| `OCI_REGISTRY_URL` | `<oci-registry-url>` | Variable | ✅ | ❌ |
| `OCI_REGISTRY_USERNAME` | `<username>` | Variable | ✅ | ✅ |
| `OCI_REGISTRY_PASSWORD` | `<password>` | Variable | ✅ | ✅ |

#### Container Registry Variables (GCP)

| Key | Value | Type | Protected | Masked |
|-----|-------|------|-----------|--------|
| `GCP_REGISTRY_URL` | `<gcp-registry-url>` | Variable | ✅ | ❌ |
| `GCP_SERVICE_ACCOUNT_KEY` | `<json-key-content>` | Variable | ✅ | ✅ |

**GCP_SERVICE_ACCOUNT_KEY** instructions:
```bash
# Paste the ENTIRE JSON content:
{
  "type": "service_account",
  "project_id": "baraq-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  ...
}
```

#### Kubernetes Variables

| Key | Value | Type | Protected | Masked |
|-----|-------|------|-----------|--------|
| `KUBECONFIG_CONTENT` | `<kubeconfig-yaml>` | Variable | ✅ | ✅ |

**KUBECONFIG_CONTENT** instructions:
```bash
# Display kubeconfig
cat ~/.kube/config

# Copy the ENTIRE output including:
# apiVersion: v1
# clusters:
# - cluster:
#     certificate-authority-data: ...
#     server: https://...
# ...
```

Paste this entire YAML content into the `KUBECONFIG_CONTENT` variable value.

#### Notification Variables

| Key | Value | Type | Protected | Masked |
|-----|-------|------|-----------|--------|
| `PUSHOVER_API_TOKEN` | `<your-app-token>` | Variable | ❌ | ✅ |
| `PUSHOVER_USER_KEY` | `<your-user-key>` | Variable | ❌ | ✅ |

Get these from:
- **API Token**: https://pushover.net/apps/build (create new application)
- **User Key**: https://pushover.net (top right after login)

#### Variable Settings Explained

- **Protected**: Only available in protected branches (main, develop)
  - Use for production secrets (registry credentials, kubeconfig)
- **Masked**: Hidden in job logs (shows `[masked]` instead of value)
  - Use for all sensitive values (passwords, keys, tokens)

### 4. Set Up Helm Values

#### Clone Deployment Configs Repository

```bash
git clone http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs.git
cd deployment-configs
```

#### Create Helm Values for TechHub

**For OCI Production** (`manifests/techhub/values-oci-prod.yaml`):
```yaml
# Reference: manifests/auth-service/values-dev.yaml

replicaCount: 2

image:
  repository: <OCI_REGISTRY>/techhub
  pullPolicy: IfNotPresent
  tag: latest  # Will be overridden by CI

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: istio
  hosts:
    - host: techhub.baraq.com
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi

env:
  - name: NODE_ENV
    value: "production"
  - name: PORT
    value: "3000"
  # Add references to backend-configs ConfigMaps/Secrets
  # DATABASE_URL, REDIS_URL, etc. from backend-configs repo

envFrom:
  - configMapRef:
      name: techhub-config
  - secretRef:
      name: techhub-secrets
```

**For GCP Development** (`manifests/techhub/values-dev.yaml`):
```yaml
# Similar to values-oci-prod.yaml but for development

replicaCount: 1

image:
  repository: <GCP_REGISTRY>/techhub
  pullPolicy: Always
  tag: latest

ingress:
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

# Reference backend-configs for dev environment
envFrom:
  - configMapRef:
      name: techhub-dev-config
  - secretRef:
      name: techhub-dev-secrets
```

#### Commit Helm Values

```bash
git add manifests/techhub/
git commit -m "feat: Add TechHub Helm values for OCI and GCP"
git push origin main
```

### 5. Enable the Pipeline

The pipeline is now ready! The `.gitlab-ci.yml` file is already in the repository.

**Pipeline will automatically run on**:
- Push to `main` branch (build + test, manual deploy to OCI)
- Push to `develop` branch (build + test + auto-deploy to GCP)
- Merge requests (build + test only)

## Testing the Pipeline

### Running the Full Pipeline

1. Navigate to **CI/CD** > **Pipelines** in GitLab UI
2. You should see a new pipeline running automatically after pushing code
3. Monitor the stages:
   - ✅ **install** - Dependencies and Prisma generation
   - ✅ **validate** - Type-check, lint, unit tests (parallel)
   - ✅ **build** - Next.js production build
   - ✅ **test** - Integration tests with PostgreSQL + Redis
   - ✅ **docker** - Build and push Docker image
   - ⏸️ **deploy** - Kubernetes deployment (manual for production)

### Manual Deployment to Production (OCI)

The deployment to OCI production requires manual approval:

1. **CI/CD** > **Pipelines** > Select your pipeline
2. Find the **deploy-oci-prod** job
3. Click the **Play** button ▶️
4. Monitor deployment progress
5. Check for Pushover notification on completion

### Automatic Deployment to Development (GCP)

Deployments to GCP development happen automatically on `develop` branch:

1. Push to `develop` branch
2. Pipeline runs through all stages
3. **deploy-gcp-dev** automatically deploys after Docker build succeeds
4. Check Pushover notification

### Verifying Deployment

After deployment completes:

```bash
# Set kubeconfig
export KUBECONFIG=/path/to/kubeconfig

# Check OCI deployment
kubectl get pods -n istio-dev -l app=techhub
kubectl get svc -n istio-dev -l app=techhub
kubectl get ingress -n istio-dev

# Check GCP deployment
kubectl get pods -n horizontal-services -l app=techhub

# View logs
kubectl logs -n istio-dev -l app=techhub --tail=100 -f

# Check application health
curl https://techhub.baraq.com/api/health
# or
curl https://techhub-dev.baraq.com/api/health
```

## Troubleshooting

### Common Issues

#### Issue 1: Docker Login Failed

**Symptoms**:
```
Error response from daemon: Get https://registry/v2/: unauthorized
```

**Causes**:
- Wrong registry credentials
- Expired service account key (GCP)
- Registry URL incorrect

**Solutions**:

**For OCI Registry**:
```bash
# Verify GitLab CI variables
# Settings > CI/CD > Variables
# Check: OCI_REGISTRY_URL, OCI_REGISTRY_USERNAME, OCI_REGISTRY_PASSWORD
```

**For GCP Registry**:
```bash
# Verify service account key is valid JSON
echo "$GCP_SERVICE_ACCOUNT_KEY" | jq .

# Check registry URL format
# Should be: gcr.io/project-id or <region>-docker.pkg.dev/project-id
```

#### Issue 2: Kubernetes Connection Failed

**Symptoms**:
```
error: You must be logged in to the server (Unauthorized)
```

**Causes**:
- Invalid kubeconfig
- Expired certificates
- Wrong cluster URL

**Solutions**:
```bash
# Test kubeconfig locally first
export KUBECONFIG=/path/to/kubeconfig
kubectl cluster-info

# Verify kubeconfig has correct cluster URL and credentials
cat ~/.kube/config

# Ensure KUBECONFIG_CONTENT variable contains entire YAML
# Including certificate-authority-data and client-certificate-data
```

#### Issue 3: Helm Deployment Failed

**Symptoms**:
```
Error: failed to create: secrets "sh.helm.release.v1.techhub.v1" already exists
```

**Causes**:
- Previous failed deployment
- Helm release in bad state

**Solutions**:
```bash
# Check Helm release status
helm list -n istio-dev

# Check release history
helm history techhub -n istio-dev

# If stuck, delete and re-deploy
helm uninstall techhub -n istio-dev
# Re-run pipeline
```

#### Issue 4: Image Pull Errors in Kubernetes

**Symptoms**:
```
Failed to pull image: unauthorized or image not found
```

**Causes**:
- Image not pushed to registry
- Wrong image repository in values
- Missing imagePullSecrets

**Solutions**:
```bash
# Verify image exists in registry
# For OCI:
docker login $OCI_REGISTRY_URL
docker pull $OCI_REGISTRY/techhub:$CI_COMMIT_SHORT_SHA

# Check Helm values
cat manifests/techhub/values-oci-prod.yaml | grep repository

# Create imagePullSecret if needed
kubectl create secret docker-registry techhub-registry \
  --docker-server=$OCI_REGISTRY_URL \
  --docker-username=$USERNAME \
  --docker-password=$PASSWORD \
  -n istio-dev
```

#### Issue 5: PostgreSQL/Redis Connection Failed in Tests

**Symptoms**:
```
Error: connect ECONNREFUSED postgres:5432
```

**Causes**:
- PostgreSQL service not ready
- Wrong connection string

**Solutions**:

The `.gitlab-ci.yml` already includes a readiness check:
```yaml
before_script:
  - until PGPASSWORD=test psql -h postgres -U test -d test -c '\q'; do
      echo "Waiting for PostgreSQL...";
      sleep 2;
    done
```

If still failing, check GitLab Runner logs for service startup errors.

#### Issue 6: Build Fails with "DATABASE_URL not found"

**Symptoms**:
```
Error: Environment variable DATABASE_URL is not set
```

**Causes**:
- Prisma client initialization during build requires DATABASE_URL
- Missing mock DATABASE_URL in build stage

**Solution**:

The `.gitlab-ci.yml` already includes mock DATABASE_URL:
```yaml
build-nextjs:
  variables:
    DATABASE_URL: "postgresql://build:build@localhost:5432/build"
    REDIS_URL: "redis://localhost:6379"
```

If still failing, ensure these variables are present in your `.gitlab-ci.yml`.

#### Issue 7: Deployment Succeeds but Application Crashes

**Symptoms**:
```
kubectl get pods -n istio-dev
# Shows: CrashLoopBackOff or Error
```

**Causes**:
- Missing runtime environment variables
- Database connection failed
- Redis connection failed

**Solutions**:
```bash
# Check pod logs
kubectl logs -n istio-dev -l app=techhub --tail=100

# Common issues:
# 1. Missing DATABASE_URL, REDIS_URL in ConfigMap/Secret
# 2. Wrong database host (should be GCP Cloud SQL proxy)
# 3. Missing backend-configs ConfigMap/Secret

# Verify ConfigMap exists
kubectl get configmap techhub-config -n istio-dev -o yaml

# Verify Secret exists
kubectl get secret techhub-secrets -n istio-dev

# Create from backend-configs if missing
# See: http://gitlab.dev.baraq.com.internal/baraq-engineering/backend-shared/backend-configs
```

### Debug Mode

Enable verbose logging for troubleshooting:

Add to `.gitlab-ci.yml` (temporarily):
```yaml
variables:
  CI_DEBUG_TRACE: "true"  # Show all commands
  DOCKER_BUILDKIT: "0"    # Disable BuildKit for verbose output
```

**Warning**: This logs ALL commands including potentially sensitive data. Remove after debugging.

### Getting Help

If you encounter issues not covered here:

1. **Check GitLab CI logs**:
   - **CI/CD** > **Pipelines** > Select pipeline > Click failed job
   - Look for error messages and stack traces

2. **Check Kubernetes logs**:
   ```bash
   kubectl logs -n istio-dev -l app=techhub --tail=200
   kubectl describe pod -n istio-dev -l app=techhub
   ```

3. **Review pipeline architecture**:
   - See [PIPELINE_ARCHITECTURE.md](PIPELINE_ARCHITECTURE.md) for detailed stage information
   - See [BUILD_STEPS.md](BUILD_STEPS.md) for command-by-command breakdown

4. **Check deployment configs**:
   - Review Helm values in deployment-configs repo
   - Verify backend-configs has correct environment variables

## Next Steps

After successful setup:

1. **Test deployment workflow**:
   - Make a small change (e.g., update README)
   - Push to `develop` branch
   - Verify automatic deployment to GCP
   - Test application functionality

2. **Review deployment operations**:
   - See [DEPLOYMENT_PLAYBOOK.md](DEPLOYMENT_PLAYBOOK.md) for day-to-day operations

3. **Understand pipeline architecture**:
   - See [PIPELINE_ARCHITECTURE.md](PIPELINE_ARCHITECTURE.md) for optimization strategies

4. **Set up monitoring** (optional):
   - Configure GitLab pipeline badges
   - Set up Grafana dashboards for K8s metrics
   - Configure Sentry for application error tracking
