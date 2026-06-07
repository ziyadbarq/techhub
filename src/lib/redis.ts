/**
 * Redis Client Singleton
 * Ensures we reuse the same Redis connection across the application
 */

import Redis from "ioredis";
import { env } from "@/config/env";

let redis: Redis | null = null;

/**
 * Get or create Redis client singleton
 */
export function getRedis(): Redis {
  if (!redis || redis.status === "end") {
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
