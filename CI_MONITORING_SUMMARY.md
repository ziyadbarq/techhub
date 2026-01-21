# CI/CD Monitoring & Validation Enhancements

## Changes Implemented

### 1. **Prisma Schema Validation** ✅

Added `npx prisma validate` before `npm run db:generate` in the validate job.

**Location**: `.gitlab-ci.yml` lines 148-150

```yaml
before_script:
  - echo "✅ Validating Prisma schema..."
  - npx prisma validate
  - npm run db:generate
```

**Benefits**:
- Catches schema syntax errors early
- Validates relationships and constraints
- Ensures migrations are possible before building
- Fails fast if schema has issues

**Example Errors Caught**:
- Invalid field types
- Circular dependencies in relations
- Missing required fields
- Invalid @map or @@map directives

---

### 2. **Build Metrics Collection** 📊

Added comprehensive metrics tracking across all build jobs.

#### Validate Job Metrics

**Location**: `.gitlab-ci.yml` lines 145-181

**Tracked Metrics**:
- Job duration (via `$CI_JOB_DURATION`)
- npm install time (via `time` command)
- Number of packages installed
- node_modules size
- Pipeline ID and commit info

**Artifacts Created**:
- `build-metrics.txt` - General validation metrics
- `npm-install.log` - Full npm install output

**Example Output**:
```
Job Duration: 145s
Pipeline ID: 12345
Commit: abc123
Branch: develop
added 1468 packages in 5.2s
node_modules size: 487M
```

#### Build Jobs Metrics

**Locations**:
- build-oci: lines 256-270, artifacts 271-274
- build-gcp: lines 343-357, artifacts 358-361

**Tracked Metrics**:
- Job duration
- Next.js build size (`.next/` directory)
- Static files size (`.next/static/`)
- node_modules size
- Pipeline and commit info

**Artifacts Created**:
- `build-size-oci.txt` - OCI build metrics
- `build-size-gcp.txt` - GCP build metrics

**Example Output**:
```
📊 Build Metrics (OCI)
Job Duration: 612s
Pipeline: 12345
Commit: abc123
Next.js build size: 142M
Static files: 38M
node_modules size: 487M
```

---

## Monitoring Dashboard (Suggested)

### GitLab CI/CD Analytics

View metrics in GitLab:
1. Go to CI/CD → Pipelines
2. Click on a pipeline → Jobs
3. Download artifacts → View metrics files

### Tracking Trends Over Time

Create a simple script to parse metrics from artifacts:

```bash
#!/bin/bash
# scripts/ci-metrics-trend.sh

# Download last 10 pipeline artifacts
for pipeline_id in $(curl -s "${GITLAB_API}/projects/${PROJECT_ID}/pipelines?per_page=10" \
  | jq -r '.[].id'); do

  # Download build-metrics.txt
  curl -s "${GITLAB_API}/projects/${PROJECT_ID}/jobs/artifacts/main/raw/build-metrics.txt?job=validate" \
    -o "metrics-${pipeline_id}.txt"
done

# Parse and display trends
echo "Pipeline,Duration,NPM_Install,Build_Size"
for file in metrics-*.txt; do
  duration=$(grep "Job Duration" $file | cut -d: -f2 | tr -d 's ')
  npm_time=$(grep "packages in" $file | grep -oP '\d+\.\d+(?=s)')
  echo "${file},${duration},${npm_time}"
done
```

### Suggested Alerts

Set up GitLab rules to alert on:

```yaml
# .gitlab/ci-alerts.yml (example)
alerts:
  build_time:
    threshold: 600s  # 10 minutes
    action: notify
    channels:
      - slack: "#ci-alerts"

  bundle_size:
    threshold: 200M
    action: warn
    message: "Build size exceeds 200M - consider code splitting"
```

---

## What to Monitor

### Critical Metrics

| Metric | Baseline | Warning | Critical |
|--------|----------|---------|----------|
| **Validate Duration** | ~2-3 min | >5 min | >10 min |
| **Build Duration** | ~6-8 min | >12 min | >20 min |
| **npm install** | ~5s (cached) | >30s | >60s |
| **node_modules** | ~450-500M | >600M | >800M |
| **Next.js build** | ~100-150M | >200M | >300M |
| **Static files** | ~30-50M | >80M | >120M |

### Trend Analysis

**Good Trends** ✅:
- Build time decreasing or stable
- Bundle size stable or decreasing
- Cache hit rate improving

**Bad Trends** ⚠️:
- Build time increasing over time
- Bundle size growing significantly
- npm install taking longer (cache misses)

---

## Using the Metrics

### 1. Performance Regression Detection

**Before merging a PR**:
```bash
# Compare current metrics with main branch
git checkout feature-branch
# Trigger pipeline, note build-size
# Compare with main branch baseline
```

**Example Check**:
```bash
# Current PR build size: 165M
# Main branch baseline: 142M
# Increase: +16% ⚠️ Investigate!
```

### 2. Dependency Audit

**When node_modules grows**:
```bash
# Check what changed
npm ls --depth=0 | wc -l  # Count packages
npm ls --parseable | xargs du -s | sort -rn | head -20  # Largest deps
```

### 3. Build Optimization

**When build time increases**:
- Check if cache is working (npm install should be ~5s)
- Review new dependencies added
- Check for type-check slowdowns
- Investigate Next.js build warnings

---

## Artifact Retention

**Current Settings**:
- Validation metrics: 30 days
- Build metrics: 7 days

**Adjust if needed**:
```yaml
artifacts:
  expire_in: 90 days  # Keep for quarterly reviews
```

---

## Integration with External Tools

### Prometheus/Grafana (Optional)

Export metrics to monitoring system:

```bash
# In after_script
- |
  # Push to pushgateway
  cat << EOF | curl --data-binary @- http://pushgateway:9091/metrics/job/gitlab-ci
  techhub_build_duration_seconds{job="validate"} $CI_JOB_DURATION
  techhub_build_size_bytes{job="build-oci"} $(du -sb .next | cut -f1)
  EOF
```

### Slack Notifications (Optional)

Send alerts on threshold breach:

```yaml
after_script:
  - |
    if [ "$CI_JOB_DURATION" -gt 600 ]; then
      curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Build exceeded 10 minutes: ${CI_JOB_DURATION}s\"}" \
        $SLACK_WEBHOOK_URL
    fi
```

---

## Troubleshooting

### Metrics Not Appearing

**Check**:
1. Job completed successfully (artifacts only saved on success)
2. Artifact expiration hasn't passed
3. GitLab runner has disk space

**Debug**:
```bash
# In job, verify files created
- ls -lh build-*.txt npm-install.log
```

### Inaccurate Timing

**Issue**: `$CI_JOB_DURATION` might not update in after_script

**Solution**: Calculate manually
```bash
- export JOB_START=$(date +%s)
# ... do work ...
- export JOB_END=$(date +%s)
- echo "Duration: $((JOB_END - JOB_START))s"
```

---

## Next Steps

### Immediate
1. ✅ Merge CI monitoring changes
2. ✅ Run first pipeline to establish baseline
3. ✅ Download and review metrics files

### Short-term (1-2 weeks)
1. Collect 10-15 pipeline runs
2. Calculate average metrics
3. Set alert thresholds

### Long-term (1-2 months)
1. Integrate with monitoring dashboard (optional)
2. Set up automated alerts (optional)
3. Create quarterly performance reviews

---

## Example: Reading Metrics

### After Pipeline Completes

1. **Go to GitLab**: CI/CD → Pipelines → [Your Pipeline]
2. **Click on validate job** → Browse (on the right)
3. **Download files**:
   - `build-metrics.txt`
   - `npm-install.log`
4. **For build jobs**: Browse build-oci or build-gcp → `build-size-*.txt`

### Sample Metrics Review

```bash
# validate job
Job Duration: 145s
npm install: 5.2s (with cache)
node_modules: 487M

# build-oci job
Job Duration: 612s (10.2 min)
Next.js build: 142M
Static files: 38M

# Analysis:
# ✅ Cache working (npm install 5s vs 33s without cache)
# ✅ Build size normal (~140M)
# ✅ Total pipeline: ~12 min (expected)
```

---

## Files Modified

1. `.gitlab-ci.yml`
   - Lines 145-150: Added Prisma validation
   - Lines 167-181: Added validate metrics collection
   - Lines 191-193: Added metrics to artifacts
   - Lines 256-274: Added build-oci metrics
   - Lines 343-361: Added build-gcp metrics

---

**Created**: 2026-01-21
**Status**: Ready for use
**Requires**: No additional setup
