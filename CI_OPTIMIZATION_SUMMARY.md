# GitLab CI/CD Optimization Summary

## Changes Implemented

### 1. **Build Performance Optimization** ⚡

#### Intelligent Caching
- **Cache Key**: Now based on `package-lock.json` instead of branch slug
  - Cache invalidates only when dependencies change
  - Shared across all jobs (validate, build-oci, build-gcp, build-and-deploy)

- **Cached Paths**:
  ```yaml
  - node_modules/      # Dependencies
  - .npm/              # npm ci cache
  - .next/cache/       # Next.js build cache
  ```

- **Expected Performance**:
  - First build: ~4.5 minutes (same as before)
  - Subsequent builds: **~2-3 minutes** (50-60% faster)
  - npm install: From 33s → **~5s** (with warm cache)

#### Cache Strategy
- `validate` job: **pull-push** (creates/updates cache)
- Build jobs: **pull** (reuses cache from validate)

---

### 2. **Branch-Based Automation** 🚀

#### Automatic Workflows

**dev branch** (push triggers):
```yaml
dev → validate → build_only (OCI + GCP)
```
- ✅ Type-check, lint, tests
- ✅ Docker image build
- ❌ NO deployment

**main branch** (push triggers):
```yaml
main → validate → build_and_deploy (OCI + GCP)
```
- ✅ Type-check, lint, tests
- ✅ Docker image build
- ✅ Auto-deploy to production via ArgoCD
- ✅ Image promotion jobs available (UAT/TEST/PERF)

#### Manual Triggers (Still Available)
- GitLab UI → CI/CD → Run Pipeline
- Select cloud (OCI/GCP)
- Select type (build_only/build_and_deploy)

---

### 3. **Environment Variables** 📝

Added explicit `LOG_LEVEL` for clarity:
```yaml
LOG_LEVEL: "info"  # Explicit control vs. default
```

Benefits:
- Prevents logger initialization issues
- Clear CI environment configuration
- Easy to adjust for debugging (change to "debug")

---

### 4. **Pipeline Error Detection** 🛡️

Added `set -o pipefail` to validate job:
```yaml
before_script:
  - set -o pipefail
  - time npm ci --prefer-offline --cache $NPM_CACHE_DIR 2>&1 | tee npm-install.log
```

**Why this matters**:
- Without `pipefail`, pipe to `tee` masks failures from `npm ci`
- Job would continue with incomplete dependencies, causing confusing errors later
- Now fails immediately if npm install fails

**Impact**: More reliable failure detection, faster debugging

---

## Migration Guide

### For Developers

**No action required!** The changes are backward compatible:

1. **Pushing to dev**:
   ```bash
   git push origin dev
   ```
   - Automatically runs: validate → build_only
   - Fast feedback without deployment overhead

2. **Pushing to main**:
   ```bash
   git push origin main
   ```
   - Automatically runs: validate → build_and_deploy
   - Deploys to production (OCI) or devment (GCP)

3. **Manual builds** (unchanged):
   - Go to GitLab UI → CI/CD → Pipelines → Run Pipeline
   - Select options as before

### For DevOps

**GitLab Runner Configuration**:
- Ensure runners have sufficient disk space for cache
  - Recommended: 10GB+ free space
  - Cache grows with dependencies (~500MB typical)

**Monitoring**:
- Watch first few builds to verify cache is working
- Check pipeline duration trends in GitLab Analytics

---

## Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **npm install** | ~33s | ~5s | 85% faster |
| **Validation stage** | ~4.5 min | ~2.5 min | 45% faster |
| **Build stage** | ~10 min | ~6 min | 40% faster |
| **Total pipeline** | ~15 min | ~9 min | 40% faster |

*Note: Improvements apply after first successful build creates cache*

---

## Workflow Examples

### Scenario 1: Feature Development
```bash
# Developer working on feature branch
git checkout -b feature/new-feature
# ... make changes ...
git push origin feature/new-feature

# Creates merge request to dev
# Manual testing in dev environment
git checkout dev
git merge feature/new-feature
git push origin dev  # ← Triggers build_only automatically

# Review passes, merge to main
git checkout main
git merge dev
git push origin main  # ← Triggers build_and_deploy automatically
```

### Scenario 2: Hotfix to Production
```bash
# Critical fix needed
git checkout -b hotfix/critical-bug main
# ... fix bug ...
git commit -m "fix: critical bug"

# Direct to main (after review)
git checkout main
git merge hotfix/critical-bug
git push origin main  # ← Immediate build_and_deploy to production
```

### Scenario 3: Manual Build for Testing
```bash
# Need to test specific configuration
# Go to GitLab UI → Pipelines → Run Pipeline
# Select:
#   - Branch: dev
#   - CLOUD: gcp
#   - type: build_only
```

---

## Rollback Plan

If issues occur, revert to manual-only triggers:

1. Comment out automatic rules:
   ```yaml
   # rules:
   #   - if: '$CI_COMMIT_BRANCH == $DEV_BRANCH && $CI_PIPELINE_SOURCE == "push"'
   #     when: always
   ```

2. Keep cache improvements (safe to keep)

3. Push changes to GitLab

---

## Testing Checklist

Before merging these changes:

- [ ] Validate YAML syntax (GitLab UI → CI/CD → Editor → Validate)
- [ ] Test dev branch push (should trigger build_only)
- [ ] Test main branch push (should trigger build_and_deploy)
- [ ] Verify cache is created after first validate job
- [ ] Verify cache is reused in build jobs
- [ ] Monitor first 3-5 builds for cache hit rate
- [ ] Check ArgoCD sync after main branch deployment

---

## Files Modified

1. `.gitlab-ci.yml` - Main CI/CD configuration
   - Added cache configuration (lines 112-121)
   - Added `set -o pipefail` for error detection (line 148)
   - Updated build-oci rules (lines 187-194)
   - Updated build-gcp rules (lines 240-247)
   - Updated build-and-push-oci-to-argo rules (lines 293-300)
   - Updated build-and-push-gcp-to-argo rules (lines 362-369)
   - Added LOG_LEVEL variable (line 61)
   - Added workflow documentation header (lines 5-22)
   - Added build metrics collection (validate, build-oci, build-gcp)

---

## Next Steps

1. **Commit and push these changes**:
   ```bash
   git add .
   git commit -m "fix: Improve logger initialization and CI pipeline optimizations

   Build Fix:
   - Use || instead of ?? for LOG_LEVEL fallback (catches empty strings)
   - Document lazy initialization pattern for better-auth

   CI/CD Improvements:
   - Add set -o pipefail to prevent npm failures from being masked
   - Cache based on package-lock.json for better invalidation
   - dev → build_only (automatic), main → build_and_deploy (automatic)
   - Add explicit LOG_LEVEL variable for clarity
   - Add build metrics tracking (duration, npm install, bundle sizes)
   - Add Prisma schema validation before build
   - Expected 40-50% speedup after first build

   Fixes: 'Error: default level:undefined must be included in custom levels'"

   git push origin main  # ← Will trigger auto-deployment!
   git push gitlab main  # ← Trigger CI/CD pipeline
   ```

2. **Monitor the pipeline**:
   - Check cache creation in validate job
   - Verify build jobs reuse cache
   - Confirm deployment completes successfully

3. **Update team documentation**:
   - Share this summary with the team
   - Update onboarding docs with new workflow

4. **Optional enhancements** (future):
   - Add health check stage after deployment
   - Implement automatic rollback on health check failure
   - Set up Slack/Teams notifications for pipeline events

---

## Support

If you encounter issues:

1. **Cache not working**:
   - Check runner disk space
   - Verify cache key in job logs
   - Clear cache via GitLab UI → CI/CD → Pipelines → Clear Runner Cache

2. **Automatic builds not triggering**:
   - Verify branch name matches exactly (`dev` vs `devment`)
   - Check pipeline source in logs (`push` vs `web` vs `merge_request_event`)

3. **Build failures**:
   - Review validate stage logs first
   - Check environment variables are set correctly
   - Verify DATABASE_URL and ENCRYPTION_KEY are accessible

---

**Created**: 2026-01-21
**Status**: Ready for deployment
