# Base Image Setup Guide
**Creating Node.js Base Images for TechHub CI/CD**

**Status**: Required before deploying commit `bf07002` (CI optimization)
**Time Required**: 15 minutes
**Access Required**: Docker registry push access (OCI + GCP)

---

## Why This Is Needed

Starting with commit `bf07002`, the TechHub Dockerfile uses custom Node.js base images instead of pulling from Docker Hub. This:

1. **Eliminates rate limiting** - Docker Hub has strict rate limits for unauthenticated pulls
2. **Improves performance** - Images cached in local registries pull faster
3. **Ensures consistency** - Same base image across all environments
4. **Upgrades Node.js** - From v20 to v22 (required by package.json)

---

## Prerequisites

### Required Tools
```bash
# Docker CLI
docker --version
# Should show: Docker version 20.10.0 or higher

# OCI CLI (for Oracle Cloud)
oci --version

# gcloud CLI (for Google Cloud)
gcloud --version
```

### Required Access
- **OCI**: Push access to `jed.ocir.io/axbp9ow0rohq` repository
- **GCP**: Push access to `me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo` repository

---

## Step-by-Step Instructions

### Step 1: Pull Official Node.js 22 Alpine Image

```bash
# Pull from Docker Hub
docker pull node:22-alpine

# Verify the image
docker images | grep node
# Should show: node  22-alpine  <image-id>  <size>

# Verify Node.js version
docker run --rm node:22-alpine node --version
# Should show: v22.x.x
```

**Expected Output:**
```
22-alpine: Pulling from library/node
4abcf2066143: Pull complete
...
Digest: sha256:abc123...
Status: Downloaded newer image for node:22-alpine
docker.io/library/node:22-alpine
```

---

### Step 2: Tag and Push to OCI Registry

```bash
# Authenticate to OCI registry (if not already authenticated)
docker login jed.ocir.io
# Username: <tenancy-namespace>/<username>
# Password: <auth-token>

# Tag the image for OCI
docker tag node:22-alpine jed.ocir.io/axbp9ow0rohq/node:22-alpine

# Push to OCI registry
docker push jed.ocir.io/axbp9ow0rohq/node:22-alpine

# Verify the push
docker pull jed.ocir.io/axbp9ow0rohq/node:22-alpine
# Should complete instantly (image already local)
```

**Expected Output:**
```
The push refers to repository [jed.ocir.io/axbp9ow0rohq/node]
5f70bf18a086: Pushed
...
22-alpine: digest: sha256:def456... size: 1234
```

---

### Step 3: Tag and Push to GCP Registry

```bash
# Authenticate to GCP Artifact Registry (if not already authenticated)
gcloud auth configure-docker me-central2-docker.pkg.dev

# Tag the image for GCP
docker tag node:22-alpine me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/node:22-alpine

# Push to GCP registry
docker push me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/node:22-alpine

# Verify the push
docker pull me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/node:22-alpine
# Should complete instantly (image already local)
```

**Expected Output:**
```
The push refers to repository [me-central2-docker.pkg.dev/...]
5f70bf18a086: Layer already exists
...
22-alpine: digest: sha256:ghi789... size: 1234
```

---

### Step 4: Verify Access from GitLab Runners

Test that the GitLab runners can pull the images:

#### OCI Runner Test
```bash
# SSH to OCI GitLab runner pod (or run via GitLab CI test job)
kubectl exec -it <oci-runner-pod> -n gitlab-runner -- sh

# Inside the pod:
docker pull jed.ocir.io/axbp9ow0rohq/node:22-alpine
# Should succeed without authentication errors
```

#### GCP Runner Test
```bash
# SSH to GCP GitLab runner pod
kubectl exec -it <gcp-runner-pod> -n gitlab-runner -- sh

# Inside the pod:
docker pull me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/node:22-alpine
# Should succeed without authentication errors
```

**Note**: If authentication fails, check that the runner service account has Artifact Registry Reader role (GCP) or appropriate IAM policies (OCI).

---

## Verification Checklist

Before deploying the updated Dockerfile:

- [ ] Node 22 Alpine image pulled from Docker Hub
- [ ] Image tagged and pushed to OCI registry
- [ ] Image tagged and pushed to GCP registry
- [ ] OCI GitLab runner can pull the image
- [ ] GCP GitLab runner can pull the image
- [ ] Image digest matches across all registries

---

## Troubleshooting

### Issue: Authentication Failed (OCI)

**Error:** `Error response from daemon: Get "https://jed.ocir.io/v2/": unauthorized`

**Solution:**
```bash
# Generate auth token in OCI Console:
# 1. User Settings → Auth Tokens → Generate Token
# 2. Copy the token
# 3. Login to Docker

docker login jed.ocir.io
# Username: <tenancy-namespace>/<username>
# Password: <paste-auth-token>
```

### Issue: Authentication Failed (GCP)

**Error:** `Error response from daemon: Get "https://me-central2-docker.pkg.dev/v2/": denied`

**Solution:**
```bash
# Reconfigure Docker credentials helper
gcloud auth configure-docker me-central2-docker.pkg.dev

# Or use explicit credentials
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin https://me-central2-docker.pkg.dev
```

### Issue: Image Too Large

**Warning:** `Image size: 180MB`

**Expected Size:** ~140-160MB for node:22-alpine

**Solution:**
- Verify you pulled `node:22-alpine` (not `node:22`)
- Alpine images are much smaller than Debian-based images
- Check with: `docker images node:22-alpine`

### Issue: GitLab Runner Cannot Pull Image

**Error in CI logs:** `Error response from daemon: pull access denied`

**Solution:**

**For OCI:**
1. Check runner service account has read access to registry
2. Verify registry path: `jed.ocir.io/axbp9ow0rohq/node:22-alpine`
3. Check OCIR policies in OCI Console

**For GCP:**
1. Grant Artifact Registry Reader role to runner service account:
   ```bash
   gcloud artifacts repositories add-iam-policy-binding gcp-brq-docker-repo \
     --location=me-central2 \
     --member=serviceAccount:gitlab-runner@project.iam.gserviceaccount.com \
     --role=roles/artifactregistry.reader
   ```

---

## Maintenance

### Updating to Newer Node.js Versions

When a new Node.js version is released (e.g., 22.1, 22.2):

```bash
# Pull the new version
docker pull node:22.1-alpine

# Tag and push to both registries
docker tag node:22.1-alpine jed.ocir.io/axbp9ow0rohq/node:22.1-alpine
docker push jed.ocir.io/axbp9ow0rohq/node:22.1-alpine

docker tag node:22.1-alpine me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/node:22.1-alpine
docker push me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/node:22.1-alpine

# Update Dockerfile to use new version
# FROM ${BASE_REGISTRY}/node:22.1-alpine AS deps
```

**Recommendation:** Keep the `:22-alpine` tag updated to latest 22.x patch version.

---

## Security Considerations

### Image Scanning

**GCP Artifact Registry** automatically scans images for vulnerabilities. View reports:
```bash
gcloud artifacts docker images scan \
  me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/node:22-alpine
```

**OCI Container Registry** supports image scanning via OCI Vulnerability Scanning Service:
```bash
oci vulnerability-scanning container scan-result get \
  --repository-id <repo-ocid> \
  --image-id <image-ocid>
```

### Base Image Updates

- **Frequency**: Check for updates monthly
- **Process**: Pull latest `node:22-alpine` → retag → push to both registries
- **Testing**: Test in dev environment before production

---

## Next Steps

After completing this setup:

1. **Verify images exist** in both registries
2. **Test GitLab pipeline** on `dev` branch
3. **Monitor first build** for performance improvements
4. **Document results** in pipeline metrics

Expected improvements after base image setup:
- ✅ No more Docker Hub rate limiting
- ✅ Faster image pulls (local registry)
- ✅ GCP builds complete in <15m

---

## Contact

**Questions?** Contact DevOps team:
- Slack: #devops-support
- Email: devops@barq.com

**Related Documentation:**
- [GitLab CI Setup Guide](GITLAB_CI_SETUP.md)
- [Build Steps Documentation](BUILD_STEPS.md)
- [Kubernetes Operations](KUBERNETES_OPERATIONS.md)