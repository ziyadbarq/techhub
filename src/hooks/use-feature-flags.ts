/**
 * useFeatureFlags Hook
 * Client-side hook for checking enabled features with real-time polling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getFeatureFlagsPollInterval,
  isFeatureFlagsPollingEnabled,
} from "@/config/feature-flags.config";
import { useFeatureFlagsContext } from "@/contexts/feature-flags-context";
import type { FeatureFlagKey } from "@/lib/features/feature-flag-keys";

interface FeatureFlagsState {
  enabledFeatures: Set<string>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and access enabled features
 * Feature flags apply uniformly to all roles
 * Polling interval configurable via NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL (default: 30 seconds)
 * Set to 0 to disable polling
 */
export function useFeatureFlags(): FeatureFlagsState {
  const router = useRouter();
  const [state, setState] = useState<FeatureFlagsState>({
    enabledFeatures: new Set(),
    isLoading: true,
    error: null,
  });

  const fetchFeatures = useCallback(async () => {
    try {
      const response = await fetch("/api/features", {
        cache: "no-store", // Never cache - always get fresh data
      });
      if (!response.ok) {
        throw new Error("Failed to fetch features");
      }

      const data = await response.json();

      // If maintenance mode is active for this user, redirect immediately
      if (data.maintenanceMode === true) {
        // Store current location so we can return here after maintenance
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/maintenance"
        ) {
          sessionStorage.setItem(
            "maintenanceReturnUrl",
            window.location.pathname,
          );
        }
        router.push("/maintenance");
        return;
      }

      setState({
        enabledFeatures: new Set(data.features),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        enabledFeatures: new Set(),
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }, [router]);

  useEffect(() => {
    // Initial fetch
    fetchFeatures();

    // Setup polling if enabled
    let pollInterval: NodeJS.Timeout | undefined;
    if (isFeatureFlagsPollingEnabled()) {
      const interval = getFeatureFlagsPollInterval();
      pollInterval = setInterval(() => {
        fetchFeatures();
      }, interval);
    }

    // Refetch when tab becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchFeatures();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchFeatures]);

  return state;
}

/**
 * Check if a specific feature is enabled
 * Uses FeatureFlagsProvider context - single fetch shared across all components
 *
 * @param featureName - Type-safe feature flag key from FEATURE_FLAGS constant
 *
 * @example
 * ```typescript
 * import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
 *
 * // ✅ Type-safe usage
 * const isEnabled = useIsFeatureEnabled(FEATURE_FLAGS.LICENSE_MANAGEMENT);
 *
 * // ❌ TypeScript error - typo caught at compile time
 * const isEnabled = useIsFeatureEnabled("LICENCES");
 * ```
 */
export function useIsFeatureEnabled(featureName?: FeatureFlagKey): boolean {
  const { isFeatureEnabled } = useFeatureFlagsContext();
  if (!featureName) {
    return true;
  }
  return isFeatureEnabled(featureName);
}
