/**
 * Feature Flags Configuration
 * Client-side configuration for feature flag polling behavior
 */

import { logger } from "@/lib/logger";

/**
 * Get the feature flags polling interval from environment variable
 * @returns Number of milliseconds between polls, or 0 to disable polling
 * @default 30000 (30 seconds)
 */
export function getFeatureFlagsPollInterval(): number {
  const envValue = process.env.NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL;

  // If not set, use default of 30 seconds
  if (!envValue) {
    return 30000;
  }

  // Parse the value
  const parsed = parseInt(envValue, 10);

  // If invalid number, use default
  if (isNaN(parsed) || parsed < 0) {
    logger
      .scope("FeatureFlagsConfig")
      .warn(
        "getPollInterval",
        `Invalid NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL: ${envValue}. Using default of 30000ms.`,
      );
    return 30000;
  }

  return parsed;
}

/**
 * Check if feature flags polling is enabled
 * @returns true if polling is enabled, false if disabled
 */
export function isFeatureFlagsPollingEnabled(): boolean {
  return getFeatureFlagsPollInterval() > 0;
}
