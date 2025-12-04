# Performance Optimizations

This document tracks all performance optimizations implemented in the Barq TechHub application.

## Table of Contents

- [Session Management](#session-management)
- [Caching Strategy](#caching-strategy)
- [Query Optimization](#query-optimization)
- [Client-Side Optimizations](#client-side-optimizations)
- [Configuration](#configuration)

---

## Session Management

### Request-Level Session Memoization

**Problem**: Multiple permission checks and server actions within a single request were making duplicate HTTP calls to `/api/auth/get-session`.

**Solution**: Wrapped `getSession()` with React's `cache()` function for request-level memoization.

**Implementation**: [src/lib/auth/session.ts](../../src/lib/auth/session.ts)

```typescript
const getSessionInternal = cache(async (): Promise<{
  session: Session | null;
  user: User | null;
}> => {
  // ... session fetch logic
});

export async function getSession(): Promise<{
  session: Session | null;
  user: User | null;
}> {
  return getSessionInternal();
}
```

**Impact**:
- Reduces duplicate session fetches from 2+ per request to exactly 1
- Eliminates redundant network calls in permission-heavy operations
- Maintains Better Auth compatibility

**Related Files**:
- [src/lib/auth/session.ts](../../src/lib/auth/session.ts)
- [src/lib/permissions/server.ts](../../src/lib/permissions/server.ts)

---

## Caching Strategy

### Redis-Based Permission Cache

**Problem**: In-memory permission cache didn't sync across PM2 processes, causing stale permissions after invalidation.

**Solution**: Hybrid Redis + in-memory caching with automatic fallback.

**Implementation**: [src/lib/permissions/cache.ts](../../src/lib/permissions/cache.ts)

**Features**:
- Primary: Redis cache (5-min TTL) for multi-process consistency
- Fallback: In-memory Map when Redis unavailable
- Automatic cache invalidation on role/permission changes
- LRU eviction for in-memory cache (max 1000 entries)

**Configuration**:
```typescript
const CACHE_CONFIG = {
  TTL_SECONDS: 5 * 60,        // Redis TTL
  TTL_MS: 5 * 60 * 1000,      // In-memory TTL
  MAX_SIZE: 1000,              // In-memory max entries
  REDIS_PREFIX: "perm:",       // Redis key prefix
};
```

**Impact**:
- Cache invalidations sync across all PM2 processes
- Graceful degradation when Redis unavailable
- Consistent permission checks across all use cases

**Related Files**:
- [src/lib/permissions/cache.ts](../../src/lib/permissions/cache.ts)
- [src/core/services/permission-cache.service.interface.ts](../../src/core/services/permission-cache.service.interface.ts)
- [src/infrastructure/services/permission-cache.service.ts](../../src/infrastructure/services/permission-cache.service.ts)
- [src/core/use-cases/rbac/check-permission.use-case.ts](../../src/core/use-cases/rbac/check-permission.use-case.ts)
- [src/core/use-cases/rbac/get-user-permissions.use-case.ts](../../src/core/use-cases/rbac/get-user-permissions.use-case.ts)

### Redis-Based Feature Flags Cache

**Problem**: Client polling `/api/features` every 30s caused constant full-table Prisma scans.

**Solution**: Redis cache for `getEnabledFeatures()` with automatic invalidation.

**Implementation**: [src/lib/features/server.ts](../../src/lib/features/server.ts)

```typescript
export async function getEnabledFeatures(): Promise<Set<string>> {
  const cacheKey = `${CACHE_PREFIX}all_enabled`;

  // Try Redis cache
  const redis = await getRedis();
  const cached = await redis.get(cacheKey);
  if (cached) {
    return new Set(JSON.parse(cached));
  }

  // Cache miss - fetch from database
  const features = await repo.getEnabledFeatureNames();
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify([...features]));

  return features;
}
```

**Invalidation**: Automatic on feature flag toggles via `invalidateAllFeaturesCache()`.

**Impact**:
- Eliminates database queries on every 30s poll
- Scales to hundreds of concurrent users
- Cache invalidates immediately on flag changes

**Related Files**:
- [src/lib/features/server.ts](../../src/lib/features/server.ts)
- [src/interface-adapters/controllers/feature-flags/feature-flag.controller.ts](../../src/interface-adapters/controllers/feature-flags/feature-flag.controller.ts)
- [src/app/api/features/route.ts](../../src/app/api/features/route.ts)

---

## Query Optimization

### N+1 Query Elimination: Roles with Permissions

**Problem**: `listRolesWithPermissionsAction()` fetched all roles, then looped to fetch permissions for each role (1 + N queries).

**Solution**: Single query with Prisma join using new `findAllWithPermissions()` repository method.

**Implementation**: [src/infrastructure/repositories/prisma-role.repository.ts](../../src/infrastructure/repositories/prisma-role.repository.ts)

```typescript
async findAllWithPermissions(params?: {
  includeInactive?: boolean;
}): Promise<Array<[Role, PermissionKey[]]>> {
  const rolesWithPermissions = await this.prisma.role.findMany({
    where: includeInactive ? undefined : { isActive: true },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  return rolesWithPermissions.map((roleData) => {
    const role = this.toDomain(roleData);
    const permissions = roleData.permissions.map(
      (rp) => rp.permission.name as PermissionKey
    );
    return [role, permissions];
  });
}
```

**Impact**:
- **50 roles**: 51 queries → 1 query (98% reduction)
- Faster role management pages
- Lower database load

**Related Files**:
- [src/core/repositories/role-repository.interface.ts](../../src/core/repositories/role-repository.interface.ts)
- [src/infrastructure/repositories/prisma-role.repository.ts](../../src/infrastructure/repositories/prisma-role.repository.ts)
- [src/interface-adapters/controllers/rbac.controller.ts](../../src/interface-adapters/controllers/rbac.controller.ts)

---

## Client-Side Optimizations

### SessionProvider Hydration Strategy (SSR Fix)

**Problem**: `DashboardLayoutClient` had hydration gate that blocked entire component tree during SSR, negating RSC streaming benefits and Suspense boundaries.

**Solution**: Moved hydration detection inside `SessionProvider`, allowing layout to render with loading states during SSR.

**Implementation**: [src/contexts/session-context.tsx](../../src/contexts/session-context.tsx)

**Strategy**:
- **SSR**: Returns `isPending: true` to enable progressive rendering with Suspense boundaries
- **Client**: Calls Better Auth's `useSession()` only after hydration completes
- **Two-Phase Provider**: Internal component `SessionProviderHydrated` uses Better Auth hook after hydration check

**Impact**:
- Enables RSC streaming to work correctly
- Suspense boundaries show skeleton states instead of blank screen
- Improves First Contentful Paint
- Dashboard content can stream progressively during SSR

**Related Files**:
- [src/contexts/session-context.tsx](../../src/contexts/session-context.tsx)
- [src/app/(dashboard)/dashboard-layout-client.tsx](../../src/app/(dashboard)/dashboard-layout-client.tsx)

---

### Feature Flag Polling Pause on Hidden Tabs

**Problem**: Polling continued in background tabs, wasting resources.

**Solution**: Pause/resume polling based on `document.visibilityState`.

**Implementation**: [src/contexts/feature-flags-context.tsx](../../src/contexts/feature-flags-context.tsx)

```typescript
const startPolling = () => {
  if (isFeatureFlagsPollingEnabled() && !pollInterval) {
    const interval = getFeatureFlagsPollInterval();
    pollInterval = setInterval(fetchFeatures, interval);
  }
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = undefined;
  }
};

// Handle visibility changes
const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    fetchFeatures(); // Immediate fetch when visible
    startPolling();  // Resume polling
  } else {
    stopPolling();   // Pause when hidden
  }
};
```

**Impact**:
- Eliminates wasteful background API calls
- Reduces server load from inactive tabs
- Immediate refresh when user returns to tab

**Configuration**:
```bash
# Disable polling entirely (fetch only on tab focus)
NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL=0

# Default: 30 seconds
NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL=30000
```

**Related Files**:
- [src/contexts/feature-flags-context.tsx](../../src/contexts/feature-flags-context.tsx)
- [src/config/feature-flags.config.ts](../../src/config/feature-flags.config.ts)

---

## Configuration

### Environment Variables

#### Feature Flag Polling

```bash
# Polling interval in milliseconds (default: 30000)
NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL=30000

# Set to 0 to disable automatic polling
# Features will only refresh when tab becomes visible
NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL=0
```

#### Redis Cache

```bash
# Redis connection for permission and feature flag caching
REDIS_URL=redis://localhost:6379
```

### Cache Configuration

All cache configurations are centralized in their respective files:

**Permissions Cache**: [src/lib/permissions/cache.ts](../../src/lib/permissions/cache.ts)
```typescript
const CACHE_CONFIG = {
  TTL_SECONDS: 5 * 60,     // 5 minutes
  MAX_SIZE: 1000,           // Max in-memory entries
  REDIS_PREFIX: "perm:",    // Redis key prefix
};
```

**Feature Flags Cache**: [src/lib/features/server.ts](../../src/lib/features/server.ts)
```typescript
const CACHE_TTL = 300;           // 5 minutes (seconds)
const CACHE_PREFIX = "feature:"; // Redis key prefix
```

---

### Parallel Permission Check Optimization

**Problem**: `hasAnyPermission()` and `hasAllPermissions()` used `Promise.all()` causing all permission checks to miss cache simultaneously on cold cache, triggering N parallel DB queries.

**Solution**: Serialize first permission check to populate cache, then parallelize remaining checks.

**Implementation**: [src/lib/permissions/check-permission.ts](../../src/lib/permissions/check-permission.ts)

```typescript
export async function hasAnyPermission(
  userId: string,
  permissions: PermissionKey[],
  context?: PermissionContext,
): Promise<boolean> {
  if (permissions.length === 0) return false;
  if (permissions.length === 1) {
    return hasPermission(userId, permissions[0], context);
  }

  // Check first permission to populate cache (if cold)
  const firstResult = await hasPermission(userId, permissions[0], context);
  if (firstResult) return true; // Short-circuit

  // Now cache is warm - check remaining permissions in parallel
  const remainingResults = await Promise.all(
    permissions.slice(1).map((permission) => hasPermission(userId, permission, context))
  );
  return remainingResults.some((result) => result === true);
}
```

**Impact**:
- Reduces N parallel DB queries to 1 DB query + (N-1) cache hits on cold cache
- Example: 8 admin permissions check → 1 DB query + 7 cache hits (instead of 8 parallel DB queries)
- Short-circuit optimization: stops early when condition is met

**Related Files**:
- [src/lib/permissions/check-permission.ts](../../src/lib/permissions/check-permission.ts)

---

## Security Fixes

### Force Dynamic Rendering for RBAC Routes

**Problem**: RBAC API routes were missing `export const dynamic = "force-dynamic"`, allowing Next.js to cache authenticated responses.

**Solution**: Added explicit dynamic export to all RBAC routes.

**Files Updated**:
- [src/app/api/rbac/my-permissions/route.ts](../../src/app/api/rbac/my-permissions/route.ts)
- [src/app/api/rbac/my-roles/route.ts](../../src/app/api/rbac/my-roles/route.ts)
- [src/app/api/rbac/roles-with-permissions/route.ts](../../src/app/api/rbac/roles-with-permissions/route.ts)

**Impact**:
- Prevents stale permission data
- Eliminates security risk of cached permissions
- Ensures fresh data on every request

---

## Monitoring

### Cache Statistics

Monitor permission cache health via the `getStats()` method:

```typescript
import { permissionCache } from "@/lib/permissions/cache";

const stats = permissionCache.getStats();
console.log({
  totalEntries: stats.totalEntries,
  validEntries: stats.validEntries,
  expiredEntries: stats.expiredEntries,
  maxSize: stats.maxSize,
  ttlSeconds: stats.ttlSeconds,
  usingRedis: stats.usingRedis,
});
```

**Metrics to Watch**:
- `validEntries` vs `totalEntries`: Cache efficiency
- `usingRedis: false`: Redis connection issues (falls back to in-memory)
- High `expiredEntries`: Consider increasing cleanup frequency

---

## Performance Metrics

### Before vs After

| Optimization | Before | After | Improvement |
|--------------|--------|-------|-------------|
| Session fetches per request | 2-5 calls | 1 call | 50-80% reduction |
| listRolesWithPermissions (50 roles) | 51 queries | 1 query | 98% reduction |
| Feature flags polling (hidden tab) | 2 req/min | 0 req/min | 100% reduction |
| Permission cache (multi-process) | Stale 0-5 min | Instant sync | Immediate |
| getEnabledFeatures (30s poll) | Prisma query | Redis cache | ~100x faster |
| hasAnyPermission (8 perms, cold cache) | 8 DB queries | 1 DB + 7 cache | 87.5% reduction |
| Dashboard SSR | Blank screen | Suspense skeletons | Progressive render |

---

## Migration Notes

### Breaking Changes

1. **IPermissionCacheService**: All methods now async (returns `Promise`)
   - Update all consumers to `await` cache operations
   - Affected: `CheckPermissionUseCase`, `GetUserPermissionsUseCase`

2. **invalidatePermissionCache**: Now async
   - Update all RBAC use cases to `await invalidatePermissionCache()`

### Deployment Checklist

- [ ] Ensure Redis is running and `REDIS_URL` is configured
- [ ] Run `npm run validate` to verify TypeScript compatibility
- [ ] Test permission invalidation across PM2 processes
- [ ] Configure `NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL` (default: 30000)
- [ ] Monitor cache hit rates in production logs

---

## Future Optimizations

Potential areas for further improvement:

1. **DataLoader for RBAC queries**: Batch permission checks in single request
2. **Server-Sent Events for feature flags**: Push updates instead of polling
3. **HTTP ETag headers for `/api/features`**: Conditional fetching
4. **Prisma read replicas**: Offload cache-miss reads to replicas
5. **CDN caching for static feature flags**: Cache unchanging flags at edge

---

## References

- [RBAC Architecture](../architecture/RBAC_ARCHITECTURE.md)
- [Feature Flags System](../features/FEATURE_FLAGS.md)
- [Redis Integration](../infrastructure/REDIS.md)
- [Next.js 16 Guide](../guides/NEXTJS_16_GUIDE.md)
