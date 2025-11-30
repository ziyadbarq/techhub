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
import { getSession } from "@/lib/auth";
import { isUserSystemAdministrator } from "./auth-utils";

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
 * Check if current user is a system administrator (bypasses all feature flags)
 */
async function isSystemAdmin(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return false;
    }
    return await isUserSystemAdministrator(session.user.id);
  } catch {
    return false;
  }
}

/**
 * Check if a feature is enabled
 * Admins always have access (bypass feature flags)
 */
export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  // Admin bypass
  const isAdmin = await isSystemAdmin();
  if (isAdmin) {
    return true;
  }

  // Check feature flag
  return await getCachedFeatureState(featureName);
}

/**
 * Check if maintenance mode is enabled
 * System admins are never blocked by maintenance mode
 */
export async function isMaintenanceModeEnabled(): Promise<boolean> {
  // Admin bypass
  const isAdmin = await isSystemAdmin();
  if (isAdmin) {
    return false;
  }

  // Check maintenance mode flag
  return await getCachedFeatureState("MAINTENANCE_MODE");
}

/**
 * Require a feature to be enabled
 * Redirects to /feature-disabled if not enabled
 * Admins always pass (bypass)
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
  // Check maintenance mode first (blocks everyone except admins)
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
 * Admins see all features
 */
export async function getEnabledFeatures(): Promise<Set<string>> {
  // Admin bypass - show all features
  const isAdmin = await isSystemAdmin();
  if (isAdmin) {
    // Return all possible features
    return new Set([
      "FOUNDATION",
      "RBAC",
      "FX_RATES",
      "DATA_IMPORT",
      "ASSETS",
      "MAINTENANCE",
      "INVENTORY",
      "WARRANTIES",
      "CMDB",
      "CONTRACTS",
      "LICENSES",
      "SERVICES",
      "SERVICE_HEALTH_SLA",
      "GOVERNANCE",
      "ATTACHMENTS",
      "ASSET_DISPOSALS",
      "ASSET_KITS",
      "ASSET_RESERVATIONS",
      "INTUNE",
    ]);
  }

  // Get enabled features from database
  const container = getContainer();
  const repo = container.get<IFeatureFlagRepository>(
    DI_TOKENS.IFeatureFlagRepository,
  );
  return await repo.getEnabledFeatureNames();
}
