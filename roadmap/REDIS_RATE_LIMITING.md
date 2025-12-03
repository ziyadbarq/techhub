# Redis-Based Rate Limiting for Better Auth

## Overview

Migrate Better Auth rate limiting from in-memory storage to Redis for persistent rate limiting across server restarts and future horizontal scaling.

## Current State

- **Storage**: In-memory (Better Auth default)
- **Issue**: Rate limits reset on server restart
- **Risk**: Attackers could bypass by triggering restarts
- **Deployment**: Single-server PM2 (acceptable for now)
- **Current limits**:
  - `/sign-in/*`: 20 attempts/min
  - `/sign-up/*`: 10 attempts/min
  - `/reset-password/*`: 5 attempts per 5 minutes
  - `/get-session`: 2000/min

## Proposed Solution

### 1. Update Better Auth Configuration

**File**: `src/infrastructure/services/auth/better-auth.ts`

**Before** (line 656):
```typescript
rateLimit: {
  enabled: true,
  window: 60,
  max: 500,
  storage: "memory",  // ← In-memory storage
  // ...
}
```

**After**:
```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL,
});

rateLimit: {
  enabled: true,
  window: 60,
  max: 500,
  storage: "redis",  // ← Redis storage
  redis: {
    client: redis,
    prefix: "auth:rl:",  // Namespace for auth rate limits
  },
  customRules: {
    // ... existing rules
  },
}
```

### 2. Redis Connection Management

**Current Redis setup**:
- Already configured: `REDIS_URL` in `.env.local`
- Already running: Homebrew Redis (macOS native)
- Already used by: Application-level rate limiting (`@upstash/ratelimit`)

**No additional setup needed** - reuse existing Redis connection.

### 3. Configuration Best Practices

**Environment variables**:
```bash
# .env.local
REDIS_URL=redis://localhost:6379

# Production
REDIS_URL=redis://:password@host:port
```

**Key naming**:
```
auth:rl:/sign-in/{user-email}
auth:rl:/sign-up/{ip-address}
auth:rl:/reset-password/{user-email}
auth:rl:/get-session/{user-id}
```

## Implementation Steps

1. **Phase 1**: Update Better Auth config
   - Change `storage: "memory"` to `storage: "redis"`
   - Add Redis client configuration
   - Test in development

2. **Phase 2**: Testing
   - Test rate limiting persists across restarts
   - Test rate limits work correctly
   - Monitor Redis memory usage

3. **Phase 3**: Production deployment
   - Deploy configuration change
   - Monitor rate limit effectiveness
   - Track Redis performance metrics

## Benefits

- **Persistent**: Rate limits survive server restarts
- **Distributed**: Works across multiple servers (future horizontal scaling)
- **Consistent**: All instances share same rate limit state
- **Reliable**: Attackers can't bypass by triggering restarts
- **Monitoring**: Can inspect rate limit state in Redis

## Considerations

- **Redis dependency**: Better Auth now depends on Redis being available
- **Failover**: If Redis is down, rate limiting fails open (no limits enforced)
- **Memory**: Monitor Redis memory usage for rate limit keys
- **Cleanup**: Rate limit keys auto-expire after window duration

## Performance Impact

- **Latency**: +2-5ms per auth request (Redis round trip)
- **Throughput**: Redis can handle 100k+ ops/sec easily
- **Memory**: ~1-5 KB per unique rate limit key
- **Network**: Local Redis (macOS) has minimal network overhead

## Alternative: Redis Cluster (Future)

For enterprise deployments:
```typescript
redis: {
  cluster: true,
  nodes: [
    { host: 'redis1.example.com', port: 6379 },
    { host: 'redis2.example.com', port: 6379 },
    { host: 'redis3.example.com', port: 6379 },
  ],
  options: {
    // Cluster configuration
  },
}
```

## Rollback Plan

If issues occur:
1. Revert to `storage: "memory"`
2. Restart application
3. Rate limiting continues working (in-memory)
4. Investigate Redis connectivity issue
5. Re-deploy after fix

## Monitoring

Add monitoring for:
- Redis connection status
- Rate limit hit rate (blocked requests)
- Rate limit key count
- Redis memory usage

**Dashboard queries**:
```redis
# Count rate limit keys
KEYS auth:rl:*

# Get specific user's rate limit
GET auth:rl:/sign-in/user@example.com

# Monitor memory usage
INFO memory
```
