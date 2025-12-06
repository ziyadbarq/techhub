/**
 * Two-Factor Authentication Rate Limiter
 *
 * Prevents brute-force attacks on 2FA verification by limiting:
 * - 5 attempts per 15 minutes per user
 *
 * Uses Redis for distributed rate limiting across server instances.
 *
 * OWASP Recommendation: Implement rate limiting on authentication endpoints
 * to prevent brute-force and credential stuffing attacks.
 */

import { RateLimiterRedis } from "rate-limiter-flexible";
import { getRedis } from "@/lib/redis";

/**
 * Rate limiter for 2FA verification attempts
 *
 * Configuration:
 * - 5 attempts per user
 * - 15 minutes (900 seconds) duration
 * - Keyed by userId to prevent account-specific brute force
 */
const twoFactorRateLimiter = new RateLimiterRedis({
  storeClient: getRedis(),
  keyPrefix: "rate_limit:2fa",
  points: 5, // Number of attempts
  duration: 900, // 15 minutes in seconds
  blockDuration: 900, // Block for same duration after limit exceeded
});

/**
 * Check if user can attempt 2FA verification
 *
 * @param userId - User ID attempting verification
 * @returns Object with allowed status and retry info
 * @throws Never - Always returns an object, never throws
 */
export async function canAttempt2FAVerification(userId: string): Promise<{
  allowed: boolean;
  remainingAttempts?: number;
  resetAfterSeconds?: number;
}> {
  try {
    const rateLimiterRes = await twoFactorRateLimiter.consume(userId, 1);

    return {
      allowed: true,
      remainingAttempts: rateLimiterRes.remainingPoints,
      resetAfterSeconds: Math.ceil(rateLimiterRes.msBeforeNext / 1000),
    };
  } catch (error: unknown) {
    // Rate limit exceeded - the error is a RateLimiterRes object
    const rateLimiterRes = error as {
      msBeforeNext: number;
      remainingPoints: number;
    };

    return {
      allowed: false,
      remainingAttempts: 0,
      resetAfterSeconds: Math.ceil(rateLimiterRes.msBeforeNext / 1000),
    };
  }
}

/**
 * Reset rate limit for a user
 * Use this after successful 2FA verification to clear the counter
 *
 * @param userId - User ID to reset
 */
export async function reset2FARateLimit(userId: string): Promise<void> {
  try {
    await twoFactorRateLimiter.delete(userId);
  } catch {
    // Ignore errors - rate limit will expire naturally
  }
}

/**
 * Get current rate limit status for a user
 * Useful for debugging or showing remaining attempts in UI
 *
 * @param userId - User ID to check
 * @returns Rate limit status or null if no limit applied yet
 */
export async function get2FARateLimitStatus(userId: string): Promise<{
  remainingAttempts: number;
  resetAfterSeconds: number;
} | null> {
  try {
    const rateLimiterRes = await twoFactorRateLimiter.get(userId);

    if (!rateLimiterRes) {
      return null;
    }

    return {
      remainingAttempts: rateLimiterRes.remainingPoints,
      resetAfterSeconds: Math.ceil(rateLimiterRes.msBeforeNext / 1000),
    };
  } catch {
    return null;
  }
}
