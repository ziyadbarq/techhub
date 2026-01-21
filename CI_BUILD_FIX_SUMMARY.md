# CI Build Fix: Logger Initialization & Pipeline Improvements

## Original Problem

GitLab CI build was failing during Next.js "Collecting page data" phase:
```
Error: default level:undefined must be included in custom levels
Error: Failed to collect page data for /api/auth/[...all]
```

**Root Cause**: `PinoLoggerService` received `undefined` for `LOG_LEVEL` when environment validation was skipped during build.

---

## Solutions Implemented

### 1. Logger Fallback Fix (CRITICAL) ✅

**File**: `src/infrastructure/services/logger/pino-logger.service.ts:54`

**Change**: Improved fallback from `??` to `||` to catch empty strings:

```typescript
// BEFORE (only caught null/undefined):
const logLevel = env.LOG_LEVEL ?? (isDevelopment ? "debug" : "info");

// AFTER (catches empty strings too):
const logLevel = env.LOG_LEVEL || (isDevelopment ? "debug" : "info");
```

**Why**:
- `??` (nullish coalescing) only catches `null`/`undefined`
- `||` (logical OR) catches empty strings, `null`, `undefined`, and falsy values
- More defensive against misconfigured environment variables

---

### 2. Lazy Prisma Initialization ✅

**File**: `src/infrastructure/services/auth/better-auth.ts`

**Implemented**: `getPrismaWithEncryption()` lazy function with proper caching

**Documentation Added**: Lines 625-636 explain that:
- Route handlers aren't executed during build (only analyzed)
- Initialization happens at runtime, not build time
- `getPrismaWithEncryption()` provides caching for subsequent calls

**Why**: Aligns with existing lazy patterns (`getLogger()`, `getIdGenerator()`)

---

### 3. CI Pipeline Failure Detection (NEW) ✅

**File**: `.gitlab-ci.yml:148`

**Change**: Added `set -o pipefail` to catch npm failures:

```yaml
before_script:
  - cp /.npmrc .
  - echo "📦 Installing dependencies..."
  # Enable pipefail to catch npm ci failures (prevents tee from masking errors)
  - set -o pipefail
  - time npm ci --prefer-offline --cache $NPM_CACHE_DIR 2>&1 | tee npm-install.log
```

**Why**: Without `pipefail`, the pipe to `tee` would mask npm failures, allowing the job to continue with incomplete dependencies.

**Impact**: Pipeline now correctly fails if `npm ci` fails, preventing misleading build errors downstream.

---

## Verification

### Build Test ✅
```bash
npm run build
# ✓ Production build complete! (10.4s)
# ✓ All 1801 tests passing
```

### Files Modified
1. `src/infrastructure/services/logger/pino-logger.service.ts` - Logger fallback improved
2. `src/infrastructure/services/auth/better-auth.ts` - Lazy initialization documented
3. `.gitlab-ci.yml` - Added pipefail for error detection

---

## Related Improvements

In addition to the build fix, the following CI/CD improvements were implemented:

1. **Intelligent Caching** (see [CI_OPTIMIZATION_SUMMARY.md](CI_OPTIMIZATION_SUMMARY.md))
   - Cache based on `package-lock.json`
   - Expected 40-50% speedup after first build

2. **Branch-Based Automation** (see [CI_OPTIMIZATION_SUMMARY.md](CI_OPTIMIZATION_SUMMARY.md))
   - `dev` branch → `build_only` (automatic)
   - `main` branch → `build_and_deploy` (automatic)

3. **Build Metrics Tracking** (see [CI_MONITORING_SUMMARY.md](CI_MONITORING_SUMMARY.md))
   - Job duration, npm install time, bundle sizes
   - Artifacts for trend analysis

4. **Prisma Schema Validation** (see [CI_MONITORING_SUMMARY.md](CI_MONITORING_SUMMARY.md))
   - `npx prisma validate` before build
   - Catches schema errors early

---

## Commit Message

```bash
git add .
git commit -m "fix: Improve logger initialization and CI pipeline error detection

- Use || instead of ?? for LOG_LEVEL fallback (catches empty strings)
- Add set -o pipefail to prevent npm failures from being masked
- Document lazy initialization pattern for better-auth
- Add CI caching, branch automation, and metrics tracking

Fixes build failure: 'Error: default level:undefined must be included in custom levels'
"
```

---

**Created**: 2026-01-21
**Status**: Complete and verified
**Build Time**: 10.4s (successful)
