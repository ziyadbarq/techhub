/**
 * Permission Caching System
 * Caches user permissions to reduce database queries
 *
 * Strategy:
 * - Redis-based cache with TTL (Time To Live) for multi-process sync
 * - Falls back to in-memory cache if Redis unavailable
 * - Cache per user ID
 * - Automatic cache invalidation on permission/role changes
 * - Fallback to database if cache miss
 */

import type { PermissionKey } from "@/core/domain/value-objects/permission-key";
import { getRedis, isRedisReady } from "@/lib/redis";

interface CachedPermissions {
  permissions: PermissionKey[];
  timestamp: number;
  expiresAt: number;
}

/**
 * Permission cache configuration
 */
const CACHE_CONFIG = {
  /**
   * Cache TTL in seconds (5 minutes) - Redis uses seconds for SETEX
   */
  TTL_SECONDS: 5 * 60,

  /**
   * Cache TTL in milliseconds (5 minutes) - for in-memory fallback
   */
  TTL_MS: 5 * 60 * 1000,

  /**
   * Maximum in-memory cache size (number of users)
   */
  MAX_SIZE: 1000,

  /**
   * Redis key prefix
   */
  REDIS_PREFIX: "perm:",
} as const;

/**
 * Hybrid permission cache (Redis + in-memory fallback)
 * Maps userId -> cached permissions
 */
class PermissionCache {
  private memoryCache = new Map<string, CachedPermissions>();
  private useRedis = true;

  private getReadyRedis() {
    const redis = getRedis();
    return isRedisReady(redis) ? redis : null;
  }

  /**
   * Get cached permissions for a user
   * Tries Redis first, falls back to in-memory cache
   * Returns null if cache miss or expired
   */
  async get(userId: string): Promise<PermissionKey[] | null> {
    const key = `${CACHE_CONFIG.REDIS_PREFIX}${userId}`;

    // Try Redis first
    if (this.useRedis) {
      try {
        const redis = this.getReadyRedis();
        if (redis) {
          const cached = await redis.get(key);
          if (cached) {
            const permissions = JSON.parse(cached) as PermissionKey[];
            return permissions;
          }
        }
      } catch (error) {
        // Redis unavailable, fall back to in-memory
        console.error("Redis error in permission cache get:", error);
        this.useRedis = false;
      }
    }

    // Fallback to in-memory cache
    const cached = this.memoryCache.get(userId);
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.memoryCache.delete(userId);
      return null;
    }

    return cached.permissions;
  }

  /**
   * Set permissions in cache for a user
   * Stores in both Redis and in-memory cache
   */
  async set(userId: string, permissions: PermissionKey[]): Promise<void> {
    const key = `${CACHE_CONFIG.REDIS_PREFIX}${userId}`;

    // Try Redis first
    if (this.useRedis) {
      try {
        const redis = this.getReadyRedis();
        if (redis) {
          await redis.setex(
            key,
            CACHE_CONFIG.TTL_SECONDS,
            JSON.stringify(permissions),
          );
        }
      } catch (error) {
        console.error("Redis error in permission cache set:", error);
        this.useRedis = false;
      }
    }

    // Also store in memory as fallback
    if (this.memoryCache.size >= CACHE_CONFIG.MAX_SIZE) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    const now = Date.now();
    this.memoryCache.set(userId, {
      permissions,
      timestamp: now,
      expiresAt: now + CACHE_CONFIG.TTL_MS,
    });
  }

  /**
   * Invalidate cache for a specific user
   * Removes from both Redis and in-memory cache
   */
  async invalidate(userId: string): Promise<void> {
    const key = `${CACHE_CONFIG.REDIS_PREFIX}${userId}`;

    // Remove from Redis
    if (this.useRedis) {
      try {
        const redis = this.getReadyRedis();
        if (redis) {
          await redis.del(key);
        }
      } catch (error) {
        console.error("Redis error in permission cache invalidate:", error);
      }
    }

    // Remove from in-memory cache
    this.memoryCache.delete(userId);
  }

  /**
   * Invalidate entire cache
   * Called when roles/permissions are modified
   */
  async invalidateAll(): Promise<void> {
    // Remove all permission keys from Redis
    if (this.useRedis) {
      try {
        const redis = this.getReadyRedis();
        if (redis) {
          const keys = await redis.keys(`${CACHE_CONFIG.REDIS_PREFIX}*`);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        }
      } catch (error) {
        console.error("Redis error in permission cache invalidateAll:", error);
      }
    }

    // Clear in-memory cache
    this.memoryCache.clear();
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const cached of this.memoryCache.values()) {
      if (now <= cached.expiresAt) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.memoryCache.size,
      validEntries,
      expiredEntries,
      maxSize: CACHE_CONFIG.MAX_SIZE,
      ttlSeconds: CACHE_CONFIG.TTL_SECONDS,
      usingRedis: this.useRedis,
    };
  }

  /**
   * Clean up expired entries from in-memory cache
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [userId, cached] of this.memoryCache.entries()) {
      if (now > cached.expiresAt) {
        expiredKeys.push(userId);
      }
    }

    for (const key of expiredKeys) {
      this.memoryCache.delete(key);
    }
  }
}

/**
 * Global permission cache instance
 */
export const permissionCache = new PermissionCache();

/**
 * Cleanup expired entries every 1 minute
 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    permissionCache.cleanup();
  }, 60 * 1000); // 1 minute
}

/**
 * Helper to invalidate cache when permissions change
 * Call this in mutation use cases (create/update/delete role/permission)
 */
export async function invalidatePermissionCache(
  scope: "user" | "all",
  userId?: string,
): Promise<void> {
  if (scope === "all") {
    await permissionCache.invalidateAll();
  } else if (scope === "user" && userId) {
    await permissionCache.invalidate(userId);
  }
}
