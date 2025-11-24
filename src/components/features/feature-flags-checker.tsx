"use client";

import { useFeatureFlags } from "@/hooks/use-feature-flags";

/**
 * FeatureFlagsChecker Component
 * Silently checks feature flags in the background
 * Triggers immediate redirect to /maintenance if maintenance mode is active
 * Must be mounted at app root level to check flags before UI renders
 */
export function FeatureFlagsChecker() {
  // This hook will:
  // 1. Fetch features immediately on mount
  // 2. Poll every 30 seconds for updates
  // 3. Redirect to /maintenance if maintenance mode is detected
  useFeatureFlags();

  // This component renders nothing - it just triggers the hook
  return null;
}
