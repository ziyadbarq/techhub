/**
 * useFeatureFlags Hook
 * Client-side hook for checking enabled features with real-time polling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface FeatureFlagsState {
  enabledFeatures: Set<string>;
  isLoading: boolean;
  error: string | null;
}

// Poll every 30 seconds to catch critical changes like maintenance mode
const POLL_INTERVAL = 30000;

/**
 * Hook to fetch and access enabled features
 * Admins get all features, regular users get only enabled ones
 * Polls every 30 seconds to detect critical changes (e.g., maintenance mode)
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

    // Poll for updates every 30 seconds
    const pollInterval = setInterval(() => {
      fetchFeatures();
    }, POLL_INTERVAL);

    // Refetch when tab becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchFeatures();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchFeatures]);

  return state;
}

/**
 * Check if a specific feature is enabled
 * @param featureName - Feature name to check (e.g., "CONTRACTS", "LICENSES")
 */
export function useIsFeatureEnabled(featureName: string): boolean {
  const { enabledFeatures, isLoading } = useFeatureFlags();

  // While loading, assume not enabled (prevents flashing UI)
  if (isLoading) {
    return false;
  }

  return enabledFeatures.has(featureName.toUpperCase());
}
