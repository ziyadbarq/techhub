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
  if (!redis) {
    redis = new Redis(env.REDIS_URL);
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
