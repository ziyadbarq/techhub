/**
 * Feature Flags Context
 * Provides centralized feature flag fetching to prevent duplicate API calls
 * All components should use useFeatureFlagsContext() instead of useFeatureFlags()
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useClientSetting } from "@/hooks/use-client-settings";

interface FeatureFlagsContextValue {
  enabledFeatures: Set<string>;
  isLoading: boolean;
  error: string | null;
  isFeatureEnabled: (featureName: string) => boolean;
  refetch: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(
  null,
);

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

/**
 * Provider that fetches feature flags ONCE and shares with all consumers
 * Handles polling, visibility changes, and maintenance mode redirect
 */
export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const router = useRouter();
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);

  // Poll interval from DB settings (falls back to build-time env → 30000)
  const pollIntervalSetting = useClientSetting(
    "NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL",
  );
  const pollIntervalMs = pollIntervalSetting
    ? parseInt(pollIntervalSetting, 10)
    : 30000;
  const effectivePollInterval =
    !Number.isNaN(pollIntervalMs) && pollIntervalMs > 0 ? pollIntervalMs : 0;
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    try {
      const response = await fetch("/api/features", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch features");
      }

      const data = await response.json();

      // Handle maintenance mode redirect
      if (data.maintenanceMode === true) {
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

      setEnabledFeatures(new Set(data.features));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Initial fetch
    fetchFeatures();

    // Setup polling if enabled
    let pollInterval: NodeJS.Timeout | undefined;

    const startPolling = () => {
      if (effectivePollInterval > 0 && !pollInterval) {
        pollInterval = setInterval(fetchFeatures, effectivePollInterval);
      }
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = undefined;
      }
    };

    // Start polling only if tab is visible
    if (document.visibilityState === "visible") {
      startPolling();
    }

    // Handle visibility changes: pause when hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchFeatures(); // Immediate fetch when tab becomes visible
        startPolling(); // Resume polling
      } else {
        stopPolling(); // Pause polling when tab is hidden
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchFeatures, effectivePollInterval]);

  const isFeatureEnabled = useCallback(
    (featureName: string): boolean => {
      if (isLoading) return false;
      return enabledFeatures.has(featureName.toUpperCase());
    },
    [enabledFeatures, isLoading],
  );

  return (
    <FeatureFlagsContext.Provider
      value={{
        enabledFeatures,
        isLoading,
        error,
        isFeatureEnabled,
        refetch: fetchFeatures,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/**
 * Hook to access feature flags from context
 * Must be used within FeatureFlagsProvider
 */
export function useFeatureFlagsContext(): FeatureFlagsContextValue {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      "useFeatureFlagsContext must be used within FeatureFlagsProvider",
    );
  }
  return context;
}

/**
 * Hook to check if a specific feature is enabled
 * Convenience wrapper around useFeatureFlagsContext
 */
export function useIsFeatureEnabledContext(featureName: string): boolean {
  const { isFeatureEnabled } = useFeatureFlagsContext();
  return isFeatureEnabled(featureName);
}
