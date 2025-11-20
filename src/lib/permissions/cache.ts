/**
 * Permission Caching System
 * Caches user permissions to reduce database queries
 *
 * Strategy:
 * - In-memory cache with TTL (Time To Live)
 * - Cache per user ID
 * - Automatic cache invalidation on permission/role changes
 * - Fallback to database if cache miss
 */

import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

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
   * Cache TTL in milliseconds (5 minutes)
   */
  TTL: 5 * 60 * 1000,

  /**
   * Maximum cache size (number of users)
   */
  MAX_SIZE: 1000,
} as const;

/**
 * In-memory permission cache
 * Maps userId -> cached permissions
 */
class PermissionCache {
  private cache = new Map<string, CachedPermissions>();

  /**
   * Get cached permissions for a user
   * Returns null if cache miss or expired
   */
  get(userId: string): PermissionKey[] | null {
    const cached = this.cache.get(userId);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(userId);
      return null;
    }

    return cached.permissions;
  }

  /**
   * Set permissions in cache for a user
   */
  set(userId: string, permissions: PermissionKey[]): void {
    // Enforce max cache size (LRU-like behavior)
    if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    this.cache.set(userId, {
      permissions,
      timestamp: now,
      expiresAt: now + CACHE_CONFIG.TTL,
    });
  }

  /**
   * Invalidate cache for a specific user
   */
  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Invalidate entire cache
   * Called when roles/permissions are modified
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const cached of this.cache.values()) {
      if (now <= cached.expiresAt) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: CACHE_CONFIG.MAX_SIZE,
      ttlMs: CACHE_CONFIG.TTL,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [userId, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        expiredKeys.push(userId);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
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
export function invalidatePermissionCache(
  scope: "user" | "all",
  userId?: string,
): void {
  if (scope === "all") {
    permissionCache.invalidateAll();
  } else if (scope === "user" && userId) {
    permissionCache.invalidate(userId);
  }
}
