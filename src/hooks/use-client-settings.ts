"use client";

/**
 * Client Settings Hook
 * Fetches NEXT_PUBLIC_* settings that may have DB overrides.
 * Falls back to build-time inlined values if the API call fails.
 *
 * IMPORTANT: Build-time defaults must use static process.env references
 * (not dynamic keys) so Next.js can inline them at compile time.
 */

import { useEffect, useState } from "react";

type ClientSettings = Record<string, string | undefined>;

// Static references so Next.js inlines these at build time
const BUILD_TIME_DEFAULTS: ClientSettings = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL:
    process.env.NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL,
  NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION:
    process.env.NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION,
  NEXT_PUBLIC_ENABLE_MS_AUTH: process.env.NEXT_PUBLIC_ENABLE_MS_AUTH,
};

let cachedSettings: ClientSettings | null = null;

export function useClientSettings(): {
  settings: ClientSettings;
  isLoading: boolean;
} {
  const [settings, setSettings] = useState<ClientSettings>(
    cachedSettings ?? BUILD_TIME_DEFAULTS,
  );
  const [isLoading, setIsLoading] = useState(cachedSettings === null);

  useEffect(() => {
    if (cachedSettings !== null) return;

    let cancelled = false;

    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings/client");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            // Merge: API values override build-time defaults
            const merged = { ...BUILD_TIME_DEFAULTS, ...data };
            cachedSettings = merged;
            setSettings(merged);
          }
        } else {
          // API failed — use build-time values
          cachedSettings = { ...BUILD_TIME_DEFAULTS };
        }
      } catch {
        // Network error — use build-time values
        cachedSettings = BUILD_TIME_DEFAULTS;
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, isLoading };
}

export function useClientSetting(key: string): string | undefined {
  const { settings } = useClientSettings();
  return settings[key];
}
