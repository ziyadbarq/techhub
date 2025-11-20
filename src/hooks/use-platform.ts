"use client";

import { useEffect, useState } from "react";

/**
 * Platform types supported by the hook
 */
export type Platform = "mac" | "windows" | "linux" | "unknown";

/**
 * SSR-safe hook to detect the user's operating system platform.
 *
 * Returns "unknown" during server-side rendering to ensure consistent
 * initial render between server and client, preventing hydration mismatches.
 * After hydration, the actual platform is detected and the component re-renders.
 *
 * @returns The detected platform type
 *
 * @example
 * ```tsx
 * const platform = usePlatform();
 * const shortcutKey = platform === "mac" ? "⌘" : "Ctrl";
 *
 * return (
 *   <button title={`Save (${shortcutKey}+S)`}>
 *     Save
 *   </button>
 * );
 * ```
 */
export function usePlatform(): Platform {
  // Default to "unknown" during SSR to match server rendering
  const [platform, setPlatform] = useState<Platform>("unknown");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Detect platform client-side only (after hydration)
    const userAgent = navigator.userAgent.toLowerCase();

    if (/(mac|iphone|ipod|ipad)/i.test(userAgent)) {
      setPlatform("mac");
    } else if (/linux/i.test(userAgent)) {
      setPlatform("linux");
    } else if (/win/i.test(userAgent)) {
      setPlatform("windows");
    } else {
      setPlatform("unknown");
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return platform;
}

/**
 * Helper function to get the modifier key symbol for the current platform.
 *
 * @param platform - The platform type
 * @returns The modifier key symbol (⌘ for Mac, Ctrl for others)
 *
 * @example
 * ```tsx
 * const platform = usePlatform();
 * const modifierKey = getModifierKey(platform);
 * // Returns "⌘" on Mac, "Ctrl" on Windows/Linux/Unknown
 * ```
 */
export function getModifierKey(platform: Platform): string {
  return platform === "mac" ? "⌘" : "Ctrl";
}
