/**
 * Feature Flag Server Utilities
 * Server-side utilities for checking and enforcing feature flags
 * Includes Redis caching for performance
 */

import { redirect } from "next/navigation";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFeatureFlagRepository } from "@/core/repositories/feature-flag.repository.interface";
import type { FeatureFlagKey } from "./feature-flag-keys";

function getFeatureFlagRepository(): IFeatureFlagRepository {
  return getContainer().get<IFeatureFlagRepository>(
    DI_TOKENS.IFeatureFlagRepository,
  );
}

/**
 * Get cached feature flag state or fetch from database
 */
async function getCachedFeatureState(featureName: string): Promise<boolean> {
  const upperName = featureName.toUpperCase();
  const repo = getFeatureFlagRepository();
  return await repo.isFeatureEnabled(upperName);
}

/**
 * Invalidate cached feature flag state
 * Call this after toggling a feature flag
 *
 * @param featureName - Type-safe feature flag key
 */
export async function invalidateFeatureCache(
  _featureName: FeatureFlagKey,
): Promise<void> {
  // Feature flags are read directly from the database in this runtime.
}

/**
 * Check if a feature is enabled
 *
 * @param featureName - Type-safe feature flag key from FEATURE_FLAGS constant
 *
 * @example
 * ```typescript
 * import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
 *
 * // ✅ Type-safe usage
 * const enabled = await isFeatureEnabled(FEATURE_FLAGS.LICENSE_MANAGEMENT);
 *
 * // ❌ TypeScript error - typo caught at compile time
 * const enabled = await isFeatureEnabled("LICENCES");
 * ```
 */
export async function isFeatureEnabled(
  featureName: FeatureFlagKey,
): Promise<boolean> {
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
 * @param featureName - Type-safe feature flag key from FEATURE_FLAGS constant
 *
 * @example
 * ```typescript
 * import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
 *
 * export default async function ContractsPage() {
 *   await requireFeature(FEATURE_FLAGS.CONTRACT_MANAGEMENT);
 *   // ... rest of component
 * }
 * ```
 */
export async function requireFeature(
  featureName: FeatureFlagKey,
): Promise<void> {
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
 * Uses Redis cache to avoid full-table scans on every poll
 */
export async function getEnabledFeatures(): Promise<Set<string>> {
  const repo = getFeatureFlagRepository();
  return await repo.getEnabledFeatureNames();
}

/**
 * Invalidate all enabled features cache
 * Call this when toggling any feature flag
 */
export async function invalidateAllFeaturesCache(): Promise<void> {
  // Feature flags are read directly from the database in this runtime.
}
