/**
 * Barq Logo Component
 *
 * Displays the official barq logo with automatic dark mode support.
 * Uses local SVG files with fallback to external URL.
 */

"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /**
   * CSS class name for the container
   */
  className?: string;
  /**
   * Width of the logo in pixels
   * @default 120
   */
  width?: number;
  /**
   * Height of the logo in pixels
   * @default 40
   */
  height?: number;
  /**
   * Whether to prioritize loading (use for above-the-fold logos)
   * @default false
   */
  priority?: boolean;
  /**
   * Whether to use fallback to external URL on error
   * Security Note: Disabled by default to prevent loading from compromised external domains
   * @default false
   */
  useFallback?: boolean;
}

/**
 * Barq Logo Component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Logo />
 *
 * // Custom size
 * <Logo width={200} height={60} />
 *
 * // With priority loading
 * <Logo priority />
 *
 * // Custom styling
 * <Logo className="opacity-80 hover:opacity-100" />
 * ```
 */
export function Logo({
  className,
  width = 120,
  height = 40,
  priority = false,
  useFallback = false,
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Use resolvedTheme which handles system preference automatically
  const isDark = mounted && resolvedTheme === "dark";

  /**
   * Fallback URL for logo when local files fail to load
   *
   * Security Note: This URL points to an external domain (barq.com).
   * If barq.com is compromised, the logo could be replaced with malicious content.
   * Consider:
   * 1. Hosting the fallback logo locally in public/logos/
   * 2. Using a CDN you control
   * 3. Implementing CSP headers to restrict image sources
   * 4. Disabling fallback in production (set useFallback={false})
   */
  const fallbackUrl =
    "https://barq.com/wp-content/uploads/logo-black-barq-no-margins1.svg";

  // Determine logo source
  const getLogoSrc = () => {
    if (error && useFallback) {
      return fallbackUrl;
    }
    return isDark ? "/logos/logo-white.svg" : "/logos/logo-black.svg";
  };

  // Show placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className={cn("relative", className)}
        style={{ width, height }}
        aria-label="barq logo"
      />
    );
  }

  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      <Image
        src={getLogoSrc()}
        alt="barq logo"
        width={width}
        height={height}
        priority={priority}
        loading={priority ? "eager" : undefined}
        onError={() => useFallback && setError(true)}
        className="object-contain"
        style={{ width: "auto", height: "auto" }}
      />
    </div>
  );
}

/**
 * Simple logo component without dark mode support
 *
 * @example
 * ```tsx
 * <SimpleLogoBlack />
 * <SimpleLogoWhite />
 * ```
 */
export function SimpleLogoBlack({
  width = 120,
  height = 40,
  className,
}: Pick<LogoProps, "width" | "height" | "className">) {
  return (
    <Image
      src="/logos/logo-black.svg"
      alt="barq logo"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      style={{ width: "auto", height: "auto" }}
    />
  );
}

export function SimpleLogoWhite({
  width = 120,
  height = 40,
  className,
}: Pick<LogoProps, "width" | "height" | "className">) {
  return (
    <Image
      src="/logos/logo-white.svg"
      alt="barq logo"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      style={{ width: "auto", height: "auto" }}
    />
  );
}
