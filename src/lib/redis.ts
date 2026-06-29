/**
 * Redis Client Singleton
 * Ensures we reuse the same Redis connection across the application
 */

import Redis from "ioredis";
import { env } from "@/config/env";

let redis: Redis | null = null;

/**
 * Redis commands are safe only after ioredis reaches ready because this client
 * disables the offline queue to fail fast when Redis is unavailable.
 */
export function isRedisReady(client: Redis): boolean {
  return client.status === "ready";
}

/**
 * Get or create Redis client singleton
 */
export function getRedis(): Redis {
  if (!redis || redis.status === "end" || redis.status === "close") {
    redis = new Redis(env.REDIS_URL, {
      connectTimeout: 500,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });

    redis.on("error", () => {
      // Cache callers fall back to the database when Redis is unavailable.
    });
    redis.on("end", () => {
      redis = null;
    });
  }
  return redis;
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
