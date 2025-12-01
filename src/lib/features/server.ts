/**
 * Feature Flag Server Utilities
 * Server-side utilities for checking and enforcing feature flags
 * Includes Redis caching for performance
 */

import { redirect } from "next/navigation";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFeatureFlagRepository } from "@/core/repositories/feature-flag.repository.interface";
import { getRedis } from "@/lib/redis";

// Cache TTL: 5 minutes (300 seconds)
const CACHE_TTL = 300;
const CACHE_PREFIX = "feature:";

/**
 * Get cached feature flag state or fetch from database
 */
async function getCachedFeatureState(featureName: string): Promise<boolean> {
  const upperName = featureName.toUpperCase();
  const cacheKey = `${CACHE_PREFIX}${upperName}`;

  try {
    const redis = await getRedis();

    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return cached === "1";
    }

    // Not in cache, fetch from database
    const container = getContainer();
    const repo = container.get<IFeatureFlagRepository>(
      DI_TOKENS.IFeatureFlagRepository,
    );
    const isEnabled = await repo.isFeatureEnabled(upperName);

    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL, isEnabled ? "1" : "0");

    return isEnabled;
  } catch (error) {
    // Redis error - fall back to database
    console.error(`Feature flag cache error for ${featureName}:`, error);
    const container = getContainer();
    const repo = container.get<IFeatureFlagRepository>(
      DI_TOKENS.IFeatureFlagRepository,
    );
    return await repo.isFeatureEnabled(upperName);
  }
}

/**
 * Invalidate cached feature flag state
 * Call this after toggling a feature flag
 */
export async function invalidateFeatureCache(
  featureName: string,
): Promise<void> {
  const upperName = featureName.toUpperCase();
  const cacheKey = `${CACHE_PREFIX}${upperName}`;

  try {
    const redis = await getRedis();
    await redis.del(cacheKey);
  } catch (error) {
    console.error(
      `Failed to invalidate feature cache for ${featureName}:`,
      error,
    );
  }
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  return await getCachedFeatureState(featureName);
}

/**
 * Check if maintenance mode is enabled
 */
export async function isMaintenanceModeEnabled(): Promise<boolean> {
  // Check maintenance mode flag
  return await getCachedFeatureState("MAINTENANCE_MODE");
}

/**
 * Require a feature to be enabled
 * Redirects to /feature-disabled if not enabled
 *
 * Use this in server components and API routes to enforce feature flags
 *
 * @example
 * ```typescript
 * export default async function ContractsPage() {
 *   await requireFeature("CONTRACTS");
 *   // ... rest of component
 * }
 * ```
 */
export async function requireFeature(featureName: string): Promise<void> {
  // Check maintenance mode first (blocks everyone)
  if (await isMaintenanceModeEnabled()) {
    redirect("/maintenance");
  }

  // Check if feature is enabled
  const enabled = await isFeatureEnabled(featureName);
  if (!enabled) {
    redirect(`/feature-disabled?feature=${featureName.toUpperCase()}`);
  }
}

/**
 * Get all enabled features (for navigation filtering)
 */
export async function getEnabledFeatures(): Promise<Set<string>> {
  // Get enabled features from database
  const container = getContainer();
  const repo = container.get<IFeatureFlagRepository>(
    DI_TOKENS.IFeatureFlagRepository,
  );
  return await repo.getEnabledFeatureNames();
}
