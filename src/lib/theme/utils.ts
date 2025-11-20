/**
 * Theme Utilities
 *
 * Utility functions for working with the theme system.
 * Provides helpers for accessing theme values, building class names,
 * and managing theme state.
 *
 * @module theme/utils
 */

import type {
  BarqColorName,
  SpacingScale,
  ShadowScale,
  RadiusScale,
  FontFamilyName,
  ThemeColorName,
} from "./types";
import {
  BARQ_COLORS,
  BARQ_SPACING,
  BARQ_SHADOWS,
  BARQ_RADIUS,
  BARQ_FONTS,
  BRAND_CLASSES,
} from "./constants";
import { cn } from "../utils";

/**
 * Get barq Brand Color
 *
 * Retrieves a barq brand color value by name.
 *
 * @param name - The color name
 * @returns The hex color value
 *
 * @example
 * ```ts
 * const yellow = getBarqColor("yellow"); // "#ffda00"
 * const black = getBarqColor("black");   // "#1e2024"
 * ```
 */
export function getBarqColor(name: BarqColorName): string {
  return BARQ_COLORS[name];
}

/**
 * Get Spacing Value
 *
 * Retrieves a spacing value from the barq spacing scale.
 *
 * @param scale - The spacing scale
 * @returns The spacing value in rem
 *
 * @example
 * ```ts
 * const small = getSpacing("sm");  // "1rem"
 * const large = getSpacing("lg");  // "2rem"
 * ```
 */
export function getSpacing(scale: SpacingScale): string {
  return BARQ_SPACING[scale];
}

/**
 * Get Shadow Value
 *
 * Retrieves a shadow value from the barq shadow system.
 *
 * @param scale - The shadow scale
 * @returns The CSS box-shadow value
 *
 * @example
 * ```ts
 * const cardShadow = getShadow("sm");
 * const modalShadow = getShadow("lg");
 * ```
 */
export function getShadow(scale: ShadowScale): string {
  return BARQ_SHADOWS[scale];
}

/**
 * Get Radius Value
 *
 * Retrieves a border radius value from the barq radius system.
 *
 * @param scale - The radius scale
 * @returns The border radius value in pixels
 *
 * @example
 * ```ts
 * const buttonRadius = getRadius("md"); // "8px"
 * const cardRadius = getRadius("lg");   // "12px"
 * ```
 */
export function getRadius(scale: RadiusScale): string {
  return BARQ_RADIUS[scale];
}

/**
 * Get Font Family
 *
 * Retrieves a font family stack from the barq typography system.
 *
 * @param name - The font family name
 * @returns The CSS font-family value
 *
 * @example
 * ```ts
 * const bodyFont = getFont("barq");      // "Graphik", ...
 * const codeFont = getFont("barq-code"); // "Fira Code", ...
 * ```
 */
export function getFont(name: FontFamilyName): string {
  return BARQ_FONTS[name];
}

/**
 * Get CSS Variable
 *
 * Generates a CSS var() expression for a theme color.
 *
 * @param name - The theme color name
 * @returns CSS var() expression
 *
 * @example
 * ```ts
 * const bg = getCSSVar("background");        // "var(--background)"
 * const yellow = getCSSVar("barq-yellow");   // "var(--color-barq-yellow)"
 * ```
 */
export function getCSSVar(name: ThemeColorName): string {
  if (name.startsWith("barq-")) {
    const colorName = name.replace("barq-", "");
    return `var(--color-barq-${colorName})`;
  }
  return `var(--${name})`;
}

/**
 * Brand Color Classes
 *
 * Generates Tailwind class names for brand colors.
 * Provides common patterns for primary and secondary brand colors.
 *
 * @example
 * ```tsx
 * // Primary brand button
 * <button className={brandColorClasses.primary.bg + " " + brandColorClasses.primary.text}>
 *   Click me
 * </button>
 *
 * // Secondary accent card
 * <div className={brandColorClasses.secondary.bgSubtle}>
 *   Content
 * </div>
 * ```
 */
export const brandColorClasses = BRAND_CLASSES;

/**
 * Build Brand Class
 *
 * Helper to build combined brand color class names.
 *
 * @param variant - The brand color variant (primary or secondary)
 * @param styles - The style properties to include
 * @returns Combined class name string
 *
 * @example
 * ```ts
 * // Yellow background with black text
 * const classes = buildBrandClass("primary", ["bg", "text"]);
 * // "bg-barq-yellow text-barq-black"
 *
 * // Light blue subtle background with hover
 * const classes = buildBrandClass("secondary", ["bgSubtle", "bgHover"]);
 * // "bg-barq-light-blue/20 hover:bg-barq-light-blue/30"
 * ```
 */
export function buildBrandClass(
  variant: "primary" | "secondary",
  styles: Array<keyof typeof BRAND_CLASSES.primary>,
): string {
  const classes = styles.map((style) => BRAND_CLASSES[variant][style]);
  return cn(...classes);
}

/**
 * Is Dark Mode
 *
 * Checks if dark mode is currently active.
 * Useful for conditional logic based on theme mode.
 *
 * @returns True if dark mode is active
 *
 * @example
 * ```ts
 * if (isDarkMode()) {
 *   console.log("Dark mode is enabled");
 * }
 * ```
 */
export function isDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/**
 * Get Current Theme Mode
 *
 * Gets the currently active theme mode.
 *
 * @returns "light" or "dark"
 *
 * @example
 * ```ts
 * const mode = getCurrentThemeMode(); // "dark"
 * ```
 */
export function getCurrentThemeMode(): "light" | "dark" {
  return isDarkMode() ? "dark" : "light";
}

/**
 * Format Color with Opacity
 *
 * Formats a hex color with opacity for use in Tailwind arbitrary values.
 *
 * @param color - Hex color value
 * @param opacity - Opacity value (0-1)
 * @returns Formatted color string
 *
 * @example
 * ```ts
 * const yellow50 = formatColorWithOpacity("#ffda00", 0.5);
 * // Can be used as: className={`bg-[${yellow50}]`}
 * ```
 */
export function formatColorWithOpacity(color: string, opacity: number): string {
  // Remove # if present
  const hex = color.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get Contrast Color
 *
 * Determines whether to use light or dark text based on background color.
 * Uses relative luminance calculation for accessibility.
 *
 * @param backgroundColor - Hex color value
 * @returns "light" or "dark"
 *
 * @example
 * ```ts
 * const textColor = getContrastColor("#ffda00"); // "dark"
 * const textColor = getContrastColor("#1e2024"); // "light"
 * ```
 */
export function getContrastColor(backgroundColor: string): "light" | "dark" {
  // Remove # if present
  const hex = backgroundColor.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? "dark" : "light";
}

/**
 * Apply Theme Transition
 *
 * Applies smooth transition classes for theme changes.
 *
 * @param baseClasses - Base class names
 * @returns Class names with transition
 *
 * @example
 * ```tsx
 * <div className={applyThemeTransition("bg-background text-foreground")}>
 *   Content with smooth theme transitions
 * </div>
 * ```
 */
export function applyThemeTransition(baseClasses: string): string {
  return cn(baseClasses, "transition-colors duration-200 ease-in-out");
}

/**
 * Theme-aware Class Builder
 *
 * Builds class names that adapt to theme mode.
 *
 * @param lightClasses - Classes for light mode
 * @param darkClasses - Classes for dark mode
 * @returns Combined class string
 *
 * @example
 * ```tsx
 * <div className={themeAwareClass("bg-white", "dark:bg-gray-900")}>
 *   Theme-aware content
 * </div>
 * ```
 */
export function themeAwareClass(
  lightClasses: string,
  darkClasses: string,
): string {
  return cn(lightClasses, darkClasses);
}
