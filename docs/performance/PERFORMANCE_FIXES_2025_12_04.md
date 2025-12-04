# Performance Fixes - December 4, 2025

This document summarizes all performance optimizations implemented on December 4, 2025.

## Summary

Implemented 10 performance fixes addressing session management, caching, query optimization, SSR optimization, and client-side efficiency. All changes validated with 1,747 passing tests.

---

## Changes Implemented

### 1. ✅ Session Memoization with React cache()

**Problem**: Multiple permission checks within a single request caused duplicate HTTP calls to `/api/auth/get-session`.

**Solution**: Wrapped `getSession()` with React's `cache()` for request-level memoization.

**Files Changed**:
- `src/lib/auth/session.ts` - Added `cache()` wrapper

**Impact**: 50-80% reduction in session fetches per request (2-5 calls → 1 call)

---

### 2. ✅ Redis-Based Permission Cache (Multi-Process Sync)

**Problem**: In-memory permission cache didn't sync across PM2 processes, causing stale permissions.

**Solution**: Hybrid Redis + in-memory cache with automatic fallback.

**Files Changed**:
- `src/lib/permissions/cache.ts` - Hybrid cache implementation
- `src/core/services/permission-cache.service.interface.ts` - Made async
- `src/infrastructure/services/permission-cache.service.ts` - Async implementation
- `src/core/use-cases/rbac/check-permission.use-case.ts` - Await cache operations
- `src/core/use-cases/rbac/get-user-permissions.use-case.ts` - Use cache service

**Breaking Changes**:
- `IPermissionCacheService` methods now return `Promise`
- `invalidatePermissionCache()` now async

**Impact**: Cache invalidations sync across all processes instantly

---

### 3. ✅ Redis Cache for getEnabledFeatures()

**Problem**: Client polling `/api/features` every 30s caused constant Prisma full-table scans.

**Solution**: Redis cache with 5-min TTL and automatic invalidation.

**Files Changed**:
- `src/lib/features/server.ts` - Added `getEnabledFeatures()` cache + `invalidateAllFeaturesCache()`
- `src/interface-adapters/controllers/feature-flags/feature-flag.controller.ts` - Call invalidation on toggles

**Impact**: Eliminates DB queries on every 30s poll, scales to hundreds of users

---

### 4. ✅ N+1 Query Elimination: listRolesWithPermissionsAction()

**Problem**: Fetched all roles (1 query), then looped to fetch permissions for each role (N queries).

**Solution**: Single query with Prisma join using new `findAllWithPermissions()` method.

**Files Changed**:
- `src/core/repositories/role-repository.interface.ts` - Added `findAllWithPermissions()`
- `src/infrastructure/repositories/prisma-role.repository.ts` - Implemented with join
- `src/interface-adapters/controllers/rbac.controller.ts` - Use new method

**Impact**: 98% reduction in queries (51 queries → 1 query for 50 roles)

---

### 5. ✅ Feature Flag Polling Pause on Hidden Tabs

**Problem**: Polling continued in background tabs, wasting resources.

**Solution**: Pause/resume polling based on `document.visibilityState`.

**Files Changed**:
- `src/contexts/feature-flags-context.tsx` - Visibility-aware polling

**Configuration**:
```bash
# Disable polling entirely (fetch only on tab focus)
NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL=0

# Default: 30 seconds
NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL=30000
```

**Impact**: Eliminates background API calls from hidden tabs

---

### 6. ✅ Force Dynamic Rendering for RBAC Routes (Security Fix)

**Problem**: RBAC API routes missing `export const dynamic = "force-dynamic"`, allowing Next.js to cache authenticated responses.

**Solution**: Added explicit dynamic export to all RBAC routes.

**Files Changed**:
- `src/app/api/rbac/my-permissions/route.ts`
- `src/app/api/rbac/my-roles/route.ts`
- `src/app/api/rbac/roles-with-permissions/route.ts`

**Impact**: Prevents stale permission data and security risk

---

### 7. ✅ Removed console.log from proxy.ts

**Problem**: Debug logging on every request violated CLAUDE.md guidelines.

**Solution**: Removed debug console.log statement.

**Files Changed**:
- `proxy.ts` - Removed lines 40-44

**Impact**: Minor performance gain, cleaner logs

---

### 8. ✅ Test Fixes for Async Cache

**Problem**: Test mocks didn't account for async cache methods.

**Solution**: Updated mocks to return promises.

**Files Changed**:
- `src/core/use-cases/rbac/__tests__/check-permission.use-case.test.ts` - Async mocks

---

### 9. ✅ SessionProvider Hydration Strategy (SSR Fix)

**Problem**: `DashboardLayoutClient` had hydration gate that blocked entire component tree during SSR, negating RSC streaming benefits and Suspense boundaries.

**Solution**: Moved hydration detection inside `SessionProvider`, allowing layout to render with loading states during SSR.

**Files Changed**:
- `src/contexts/session-context.tsx` - Added `useHydrated()` hook and two-phase provider
- `src/app/(dashboard)/dashboard-layout-client.tsx` - Removed top-level hydration gate

**Implementation**:
```typescript
// SSR: Returns isPending: true to enable progressive rendering
if (!isHydrated) {
  return (
    <SessionContext.Provider value={{ session: null, user: null, isPending: true, error: null }}>
      {children}
    </SessionContext.Provider>
  );
}

// After hydration: Use Better Auth's useSession()
return <SessionProviderHydrated>{children}</SessionProviderHydrated>;
```

**Impact**: Enables RSC streaming and Suspense boundaries, improves First Contentful Paint

---

### 10. ✅ Parallel Permission Check Race Condition Fix

**Problem**: `hasAnyPermission()` and `hasAllPermissions()` used `Promise.all()` causing all permission checks to miss cache simultaneously on cold cache, triggering N parallel DB queries.

**Solution**: Serialize first permission check to populate cache, then parallelize remaining checks.

**Files Changed**:
- `src/lib/permissions/check-permission.ts` - Serial-then-parallel strategy

**Implementation**:
```typescript
// Check first permission to populate cache (if cold)
const firstResult = await hasPermission(userId, permissions[0], context);
if (firstResult) return true; // Short-circuit

// Now cache is warm - check remaining permissions in parallel
const remainingResults = await Promise.all(
  permissions.slice(1).map((permission) => hasPermission(userId, permission, context))
);
return remainingResults.some((result) => result === true);
```

**Impact**: Reduces N parallel DB queries to 1 DB query + (N-1) cache hits on cold cache

---

## Documentation Updates

### New Documentation
- `docs/performance/PERFORMANCE_OPTIMIZATIONS.md` - Comprehensive performance guide
- `docs/performance/PERFORMANCE_FIXES_2025_12_04.md` - This file

### Updated Documentation
- `docs/README.md` - Added Performance Optimizations link
- `.env.example` - Documented Redis caching usage and polling configuration

---

## Configuration Changes

### Environment Variables

#### Updated .env.example

**Feature Flag Polling**:
```bash
# Set to 0 to completely disable automatic polling
NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL=30000
```

**Redis Usage**:
```bash
# Now used for: Background jobs + Permission cache + Feature flag cache
REDIS_URL=redis://localhost:6379
```

### Cache Configuration

**Permissions Cache** (`src/lib/permissions/cache.ts`):
```typescript
const CACHE_CONFIG = {
  TTL_SECONDS: 5 * 60,     // Redis TTL: 5 minutes
  TTL_MS: 5 * 60 * 1000,   // In-memory TTL: 5 minutes
  MAX_SIZE: 1000,           // In-memory max entries
  REDIS_PREFIX: "perm:",    // Redis key prefix
};
```

**Feature Flags Cache** (`src/lib/features/server.ts`):
```typescript
const CACHE_TTL = 300;           // 5 minutes (seconds)
const CACHE_PREFIX = "feature:"; // Redis key prefix
```

---

## Performance Metrics

### Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Session fetches/request | 2-5 calls | 1 call | 50-80% ↓ |
| listRolesWithPermissions (50 roles) | 51 queries | 1 query | 98% ↓ |
| Feature polling (hidden tab) | 2 req/min | 0 req/min | 100% ↓ |
| Permission cache (multi-process) | Stale 0-5 min | Instant | ∞ better |
| getEnabledFeatures (30s poll) | Prisma | Redis | ~100x ↑ |

---

## Migration Guide

### Breaking Changes

1. **IPermissionCacheService** methods now async:
   ```typescript
   // Before
   const perms = cache.get(userId);
   cache.set(userId, permissions);

   // After
   const perms = await cache.get(userId);
   await cache.set(userId, permissions);
   ```

2. **invalidatePermissionCache()** now async:
   ```typescript
   // Before
   invalidatePermissionCache("all");

   // After
   await invalidatePermissionCache("all");
   ```

### Deployment Checklist

- [x] Redis running and `REDIS_URL` configured
- [x] All tests passing (1,747 tests ✓)
- [x] TypeScript validation passing
- [x] ESLint validation passing
- [ ] Monitor Redis connection in production logs
- [ ] Monitor cache hit rates
- [ ] Configure `NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL` if needed

---

## Validation

### Test Results

```bash
npm run validate
```

**Results**:
- ✅ Type-check: PASS
- ✅ Lint: PASS
- ✅ Tests: 1,747 passed (76 test files)

### Files Modified

**Total**: 20 files changed

**Core Logic**:
1. `src/lib/auth/session.ts`
2. `src/lib/permissions/cache.ts`
3. `src/lib/permissions/check-permission.ts`
4. `src/lib/features/server.ts`
5. `src/core/services/permission-cache.service.interface.ts`
6. `src/infrastructure/services/permission-cache.service.ts`
7. `src/core/use-cases/rbac/check-permission.use-case.ts`
8. `src/core/use-cases/rbac/get-user-permissions.use-case.ts`
9. `src/core/repositories/role-repository.interface.ts`
10. `src/infrastructure/repositories/prisma-role.repository.ts`
11. `src/interface-adapters/controllers/rbac.controller.ts`
12. `src/interface-adapters/controllers/feature-flags/feature-flag.controller.ts`
13. `src/contexts/feature-flags-context.tsx`
14. `src/contexts/session-context.tsx`
15. `proxy.ts`

**Client Components**:
16. `src/app/(dashboard)/dashboard-layout-client.tsx`

**API Routes**:
17. `src/app/api/rbac/my-permissions/route.ts`
18. `src/app/api/rbac/my-roles/route.ts`
19. `src/app/api/rbac/roles-with-permissions/route.ts`

**Tests**:
20. `src/core/use-cases/rbac/__tests__/check-permission.use-case.test.ts`

---

## Monitoring

### Redis Cache Health

Monitor via `permissionCache.getStats()`:

```typescript
import { permissionCache } from "@/lib/permissions/cache";

const stats = permissionCache.getStats();
console.log({
  totalEntries: stats.totalEntries,
  validEntries: stats.validEntries,
  expiredEntries: stats.expiredEntries,
  usingRedis: stats.usingRedis, // Should be true in production
});
```

**Alerts to Configure**:
- `usingRedis: false` - Redis connection issue (falls back to in-memory)
- High `expiredEntries` - Consider increasing cleanup frequency
- Low hit rate - Cache TTL may be too short

---

## Future Optimizations

Potential follow-ups:

1. **DataLoader for RBAC**: Batch permission checks within request
2. **Server-Sent Events for feature flags**: Push instead of poll
3. **ETag headers for `/api/features`**: Conditional fetching
4. **Prisma read replicas**: Offload cache-miss reads

---

## References

- [Performance Optimizations Guide](./PERFORMANCE_OPTIMIZATIONS.md)
- [RBAC Architecture](../architecture/RBAC_ARCHITECTURE.md)
- [Next.js 16 Guide](../guides/NEXTJS_16_GUIDE.md)
- [Prisma Guide](../guides/PRISMA_GUIDE.md)
