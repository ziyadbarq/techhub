# GitLab CI Cache Setup Guide

**Status:** Configuration Required
**Priority:** High (2-3x build time improvement)
**Owner:** DevOps Team + Development Team

---

## Overview

This guide covers setting up GitLab CI cache for the TechHub pipeline. Proper cache configuration reduces build times from ~16 minutes to ~8-9 minutes by caching npm dependencies, Prisma artifacts, and Next.js build cache.

**Current Status:**
```
WARNING: Cache file does not exist
No URL provided, cache will not be downloaded from shared cache server
```

**Root Cause:** GitLab Runner doesn't have a cache storage backend configured.

---

## Table of Contents

- [Quick Start for Developers](#quick-start-for-developers)
- [Infrastructure Setup (DevOps)](#infrastructure-setup-devops)
- [Cache Configuration](#cache-configuration)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Quick Start for Developers

### Prerequisites

DevOps team must complete [Infrastructure Setup](#infrastructure-setup-devops) first.

### Current Performance (No Cache)

| Stage | Duration | Cached Duration | Improvement |
|-------|----------|-----------------|-------------|
| npm ci | 60-90s | 10-15s | **80% faster** |
| Prisma generate | 15-20s | 5-8s | **60% faster** |
| Next.js build | 180-240s | 120-150s | **40% faster** |
| **Total validate** | **6min** | **3-4min** | **~40% faster** |
| **Total build** | **12min** | **8-9min** | **~30% faster** |

### Verify Cache is Working

After DevOps configures cache backend, check pipeline logs:

```bash
# ✅ Cache working:
Checking cache for npm-dev-1a2b3c4d...
Successfully extracted cache

# ❌ Cache not working:
WARNING: Cache file does not exist
Failed to extract cache
```

---

## Infrastructure Setup (DevOps)

### Option 1: Google Cloud Storage (GCS) - Recommended

Since runners are on GCP (`me-central2`), GCS is the most efficient option.

#### Step 1: Create GCS Bucket

```bash
# Create dedicated bucket for GitLab cache
gsutil mb -p gcp-brq-shd-prd-prj-74ba \
  -l me-central2 \
  -b on \
  gs://gitlab-runner-cache-techhub/

# Enable versioning (helps with debugging)
gsutil versioning set on gs://gitlab-runner-cache-techhub/

# Set lifecycle policy to auto-delete old cache (cost optimization)
cat > /tmp/cache-lifecycle.json <<'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 7,
          "matchesPrefix": ["runner/"]
        }
      },
      {
        "action": {"type": "Delete"},
        "condition": {
          "numNewerVersions": 3
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/cache-lifecycle.json gs://gitlab-runner-cache-techhub/

# Verify bucket created
gsutil ls -L gs://gitlab-runner-cache-techhub/
```

#### Step 2: Create Service Account

```bash
# Create service account for cache access
gcloud iam service-accounts create gitlab-runner-cache \
  --project=gcp-brq-shd-prd-prj-74ba \
  --display-name="GitLab Runner Cache Storage Access"

# Grant Storage Object Admin permissions
gcloud projects add-iam-policy-binding gcp-brq-shd-prd-prj-74ba \
  --member="serviceAccount:gitlab-runner-cache@gcp-brq-shd-prd-prj-74ba.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Verify permissions
gcloud projects get-iam-policy gcp-brq-shd-prd-prj-74ba \
  --flatten="bindings[].members" \
  --filter="bindings.members:gitlab-runner-cache@*"
```

#### Step 3: Configure Authentication

**Option A: Workload Identity (Recommended)**

```bash
# Bind GCP service account to K8s service account
gcloud iam service-accounts add-iam-policy-binding \
  gitlab-runner-cache@gcp-brq-shd-prd-prj-74ba.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:gcp-brq-shd-prd-prj-74ba.svc.id.goog[gitlab-runner/gitlab-runner]"

# Annotate Kubernetes service account
kubectl annotate serviceaccount gitlab-runner \
  -n gitlab-runner \
  iam.gke.io/gcp-service-account=gitlab-runner-cache@gcp-brq-shd-prd-prj-74ba.iam.gserviceaccount.com \
  --overwrite

# Verify annotation
kubectl get serviceaccount gitlab-runner -n gitlab-runner -o yaml | grep iam.gke.io
```

**Option B: Service Account Key (Alternative)**

```bash
# Create and download key
gcloud iam service-accounts keys create gitlab-runner-cache-key.json \
  --iam-account=gitlab-runner-cache@gcp-brq-shd-prd-prj-74ba.iam.gserviceaccount.com

# Create Kubernetes secret
kubectl create secret generic gitlab-runner-cache-gcs-key \
  -n gitlab-runner \
  --from-file=key.json=gitlab-runner-cache-key.json

# Clean up local key file
rm gitlab-runner-cache-key.json
```

#### Step 4: Configure GitLab Runner

Update GitLab Runner Helm values or ConfigMap:

**Using Workload Identity (Recommended):**

```yaml
# values.yaml or ConfigMap
runners:
  config: |
    [[runners]]
      name = "techhub-runner"

      [runners.kubernetes]
        # ... existing kubernetes config ...

      [runners.cache]
        Type = "gcs"
        Shared = true
        [runners.cache.gcs]
          BucketName = "gitlab-runner-cache-techhub"
          # No CredentialsFile needed - uses Workload Identity
```

**Using Service Account Key:**

```yaml
# values.yaml or ConfigMap
runners:
  config: |
    [[runners]]
      name = "techhub-runner"

      [runners.kubernetes]
        # ... existing kubernetes config ...

        [[runners.kubernetes.volumes.secret]]
          name = "gitlab-runner-cache-gcs-key"
          mount_path = "/secrets/gcs-key"
          read_only = true

      [runners.cache]
        Type = "gcs"
        Shared = true
        [runners.cache.gcs]
          BucketName = "gitlab-runner-cache-techhub"
          CredentialsFile = "/secrets/gcs-key/key.json"
```

#### Step 5: Apply Configuration

```bash
# If using Helm
helm upgrade gitlab-runner gitlab/gitlab-runner \
  -n gitlab-runner \
  -f values.yaml

# If using ConfigMap, edit and restart
kubectl edit configmap gitlab-runner -n gitlab-runner
kubectl rollout restart deployment gitlab-runner -n gitlab-runner

# Wait for rollout
kubectl rollout status deployment gitlab-runner -n gitlab-runner

# Verify runner is ready
kubectl get pods -n gitlab-runner -l app=gitlab-runner
```

#### Step 6: Verify Setup

```bash
# Check runner logs for cache configuration
kubectl logs -n gitlab-runner -l app=gitlab-runner --tail=50 | grep -i cache

# Look for:
# ✅ "Using GCS cache" or "Cache configured"
# ❌ "Cache not configured" or errors

# Test with a pipeline run and check for:
# ✅ "Checking cache for..."
# ✅ "Successfully extracted cache"
```

---

### Option 2: Amazon S3 (Alternative)

If you prefer S3 or have multi-cloud setup:

```yaml
# Runner config
[runners.cache]
  Type = "s3"
  Shared = true
  [runners.cache.s3]
    ServerAddress = "s3.amazonaws.com"
    BucketName = "gitlab-runner-cache"
    BucketLocation = "us-east-1"
    # Use IAM role (preferred) or access keys
    AccessKey = "${AWS_ACCESS_KEY_ID}"
    SecretKey = "${AWS_SECRET_ACCESS_KEY}"
```

**Note:** Requires AWS credentials configured in runner environment.

---

## Cache Configuration

### Current Pipeline Cache (Already Configured)

The pipeline already has cache configuration in [.gitlab-ci.yml](../../.gitlab-ci.yml):

```yaml
# Global cache anchor
.build_cache: &build_cache
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/
    - .npm/
    - .next/cache/
  policy: pull
```

**Status:** ✅ Configuration is correct, just needs backend enabled.

### Enhanced Cache Configuration (Optional Improvements)

Once basic cache is working, consider these enhancements:

#### 1. Branch-Specific Cache with Fallbacks

```yaml
.build_cache: &build_cache
  key:
    # Include branch in cache key
    prefix: ${CI_COMMIT_REF_SLUG}
    files:
      - package-lock.json
  paths:
    - node_modules/
    - .npm/
    - .next/cache/
  policy: pull
  # Fallback to other branches if cache miss
  fallback_keys:
    - ${CI_COMMIT_REF_SLUG}-     # Same branch, different lock file
    - main-                       # Main branch cache
    - default-                    # Any cache
```

**Benefits:**
- Faster cache hits for feature branches
- Graceful degradation if dependencies change
- Main branch cache shared across team

#### 2. Separate Cache Layers

```yaml
validate:
  cache:
    # Layer 1: npm dependencies
    - key:
        prefix: npm-${CI_COMMIT_REF_SLUG}
        files:
          - package-lock.json
      paths:
        - node_modules/
        - .npm/
      policy: pull-push

    # Layer 2: Prisma artifacts
    - key:
        prefix: prisma-${CI_COMMIT_REF_SLUG}
        files:
          - prisma/schema.prisma
          - prisma/schema/*.prisma
      paths:
        - node_modules/.prisma/
        - src/generated/prisma/
      policy: pull-push
```

**Benefits:**
- Independent invalidation (schema changes don't invalidate npm cache)
- Smaller cache size per layer
- Better cache hit rates

#### 3. Cache Statistics Monitoring

Add to pipeline for visibility:

```yaml
.cache_stats: &cache_stats
  before_script:
    - echo "📦 Cache Status:"
    - |
      if [ -d "node_modules" ]; then
        echo "✅ node_modules: $(du -sh node_modules | cut -f1)"
      else
        echo "❌ Cache miss - downloading dependencies"
      fi

# Apply to jobs
validate:
  <<: *cache_stats
  # ... rest of job config
```

---

## Performance Optimization

### 1. Cache Key Strategy

**Current (Simple):**
```yaml
key:
  files:
    - package-lock.json
```

**Optimized (Branch + Dependencies):**
```yaml
key:
  prefix: ${CI_COMMIT_REF_SLUG}
  files:
    - package-lock.json
fallback_keys:
  - ${CI_COMMIT_REF_SLUG}-
  - main-
```

### 2. Cache Pull vs Pull-Push

```yaml
# ❌ BAD: All jobs push to cache
cache:
  policy: pull-push  # Overwrites cache even on failure

# ✅ GOOD: Only validate stage pushes
validate:
  cache:
    policy: pull-push  # Write cache

build-gcp:
  cache:
    policy: pull       # Read-only
```

### 3. Kaniko Layer Caching

Current Kaniko config already optimized:

```yaml
/kaniko/executor \
  --cache=true \
  --cache-ttl=168h \      # 7 days
  --snapshot-mode=redo
```

**Optional Enhancement:**
```yaml
# Add dedicated cache repository
--cache-repo=${DEV_CNTNR_GCP_REG_IMG_PREFIX}/techhub/cache
```

### 4. Next.js/Turbopack Cache

Ensure Turbopack cache is included:

```yaml
paths:
  - node_modules/
  - .npm/
  - .next/cache/      # ✅ Already included
  - .turbo/           # Add if using turbo monorepo
```

---

## Troubleshooting

### Cache Not Restoring

**Symptoms:**
```
WARNING: Cache file does not exist
Failed to extract cache
```

**Checks:**

1. **Verify runner cache configuration:**
   ```bash
   kubectl get configmap gitlab-runner -n gitlab-runner -o yaml | grep -A 20 cache
   ```

2. **Check runner logs:**
   ```bash
   kubectl logs -n gitlab-runner -l app=gitlab-runner --tail=100 | grep -i cache
   ```

3. **Verify GCS bucket access:**
   ```bash
   gsutil ls gs://gitlab-runner-cache-techhub/
   gsutil ls gs://gitlab-runner-cache-techhub/runner/
   ```

4. **Test service account permissions:**
   ```bash
   # From runner pod
   kubectl exec -it -n gitlab-runner $(kubectl get pod -n gitlab-runner -l app=gitlab-runner -o name | head -1) -- sh

   # Inside pod (if using key file)
   cat /secrets/gcs-key/key.json

   # If using Workload Identity
   curl -H "Metadata-Flavor: Google" \
     http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email
   ```

### Cache Key Mismatch

**Symptoms:**
```
Checking cache for npm-dev-a1b2c3d4...
Cache not found
```

**Solution:**

```yaml
# Add fallback keys
fallback_keys:
  - ${CI_COMMIT_REF_SLUG}-
  - main-
  - default-
```

### Cache Corruption

**Symptoms:**
```
Extracting cache... ERROR
Invalid cache archive
```

**Solution:**

```bash
# Clear cache for specific key
gsutil rm gs://gitlab-runner-cache-techhub/runner/project/346/npm-dev-*/cache.zip

# Or clear all cache (nuclear option)
gsutil -m rm -r gs://gitlab-runner-cache-techhub/runner/**
```

### High Storage Costs

**Symptoms:**
- GCS storage costs increasing over time
- Bucket size > 50GB

**Solution:**

```bash
# Check bucket size
gsutil du -sh gs://gitlab-runner-cache-techhub/

# Adjust lifecycle policy (more aggressive)
cat > /tmp/cache-lifecycle-aggressive.json <<'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 3,                      # 3 days instead of 7
          "matchesPrefix": ["runner/"]
        }
      },
      {
        "action": {"type": "Delete"},
        "condition": {
          "numNewerVersions": 1          # Keep only latest version
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/cache-lifecycle-aggressive.json gs://gitlab-runner-cache-techhub/
```

---

## Maintenance

### Monthly Tasks

1. **Review cache storage costs:**
   ```bash
   # Check bucket size and costs
   gsutil du -sh gs://gitlab-runner-cache-techhub/

   # Check in GCP Console: Storage > Browser > gitlab-runner-cache-techhub
   ```

2. **Review cache hit rates:**
   - Check pipeline logs for cache success rate
   - Monitor average build times (should be stable with cache)

3. **Clean old caches manually (if needed):**
   ```bash
   # List old cache files
   gsutil ls -lh gs://gitlab-runner-cache-techhub/runner/ | head -20

   # Delete caches older than 14 days
   gsutil -m rm $(gsutil ls gs://gitlab-runner-cache-techhub/runner/** | \
     xargs -I {} gsutil stat {} | \
     awk '/Time created:/ {print $3}' | \
     xargs -I {} date -d {} +%s | \
     awk -v now=$(date +%s) '$1 < now - 1209600 {print}')
   ```

### Quarterly Tasks

1. **Review lifecycle policies:** Adjust age/version settings based on usage
2. **Audit service account permissions:** Ensure principle of least privilege
3. **Review cache key strategy:** Optimize based on actual hit rates
4. **Update documentation:** Reflect any configuration changes

---

## Performance Benchmarks

### Before Cache (Current State)

```
Pipeline: 36764 (dev branch)
├─ validate: 6min 0s
│  ├─ npm ci: 60s (downloading 1468 packages)
│  ├─ db:generate: 15s
│  ├─ type-check: 180s
│  └─ lint: 60s
│
└─ build-gcp: 16min 2s
   ├─ npm ci: 60s (re-downloading 1468 packages)
   ├─ db:generate: 15s
   ├─ build:fast: 240s
   └─ Docker build: 240s

Total: ~22 minutes
```

### After Cache (Expected)

```
Pipeline: XXXXX (dev branch)
├─ validate: 3min 30s
│  ├─ npm ci: 15s (✅ cache hit)
│  ├─ db:generate: 8s (✅ cache hit)
│  ├─ type-check: 120s
│  └─ lint: 45s
│
└─ build-gcp: 8min 30s
   ├─ npm ci: 10s (✅ cache hit)
   ├─ db:generate: 5s (✅ cache hit)
   ├─ build:fast: 150s (✅ partial cache)
   └─ Docker build: 60s

Total: ~12 minutes
Improvement: 45% faster (10 min saved)
```

---

## Cost Analysis

### GCS Storage Costs (Estimates)

```
Cache Size per Build:
- node_modules: ~800MB
- .npm cache: ~200MB
- .next/cache: ~50MB
Total: ~1GB per cache

Expected Usage:
- Branches: 5-10 active branches
- Cache per branch: 1GB
- Retention: 7 days
- Total storage: 5-10GB

GCS Costs (me-central2):
- Storage: $0.020/GB/month
- Monthly cost: 5-10GB × $0.020 = $0.10-$0.20/month
- Operations: ~$0.05/month
- Total: ~$0.15-$0.25/month

ROI:
- Developer time saved: ~10min per build × ~20 builds/day = 200min/day
- At $50/hr developer cost: $166/day saved
- Cache cost: $0.25/month (~$0.008/day)
- ROI: 20,000x return on investment
```

---

## References

- [GitLab Runner Cache Documentation](https://docs.gitlab.com/runner/configuration/advanced-configuration.html#the-runnerscache-section)
- [GCS Best Practices](https://cloud.google.com/storage/docs/best-practices)
- [Workload Identity Setup](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [Pipeline Optimization Guide](GITLAB_CI_SETUP.md)
- [Build Steps Documentation](BUILD_STEPS.md)

---

## Support

**For Infrastructure Issues:**
- Contact: DevOps Team
- Slack: #devops-support

**For Pipeline Configuration:**
- Contact: Development Team Lead
- Documentation: [GITLAB_CI_SETUP.md](GITLAB_CI_SETUP.md)

**Emergency Cache Clear:**
```bash
# If cache is causing build failures, clear it:
gsutil -m rm -r gs://gitlab-runner-cache-techhub/runner/project/346/
```

---

**Last Updated:** 2026-02-03
**Version:** 1.0
**Status:** Pending Infrastructure Setup
