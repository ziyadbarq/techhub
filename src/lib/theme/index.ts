/**
 * Theme System
 *
 * Centralized theme system for the Slidev AI RAG Task Manager.
 * Provides type-safe access to brand colors, design tokens, and theme utilities.
 *
 * @module theme
 *
 * @example
 * ```ts
 * import { BARQ_COLORS, getBarqColor, brandColorClasses } from "@/lib/theme";
 *
 * // Access brand colors
 * const yellow = BARQ_COLORS.yellow; // "#ffda00"
 * const yellow2 = getBarqColor("yellow"); // "#ffda00"
 *
 * // Use in components
 * <button className={brandColorClasses.primary.bg}>
 *   Click me
 * </button>
 * ```
 */

// ===================================
// Types
// ===================================
export type {
  BarqColorName,
  BarqColor,
  SemanticColorName,
  ChartColorName,
  SidebarColorName,
  ThemeColorName,
  SpacingScale,
  SpacingValue,
  ShadowScale,
  ShadowValue,
  RadiusScale,
  RadiusValue,
  FontFamilyName,
  FontFamilyValue,
  ThemeMode,
  ThemeConfig,
  DesignToken,
  ThemeUtils,
} from "./types";

// ===================================
// Constants
// ===================================
export {
  BARQ_COLORS,
  BARQ_SPACING,
  BARQ_SHADOWS,
  BARQ_RADIUS,
  BARQ_FONTS,
  CSS_VARIABLES,
  BRAND_CLASSES,
  THEME_TRANSITION,
} from "./constants";

// ===================================
// Design Tokens
// ===================================
export {
  colorTokens,
  spacingTokens,
  shadowTokens,
  radiusTokens,
  typographyTokens,
  designTokens,
  getTokenValue,
  getTokenVariable,
  getTokenCSSValue,
} from "./tokens";

// ===================================
// Utilities
// ===================================
export {
  getBarqColor,
  getSpacing,
  getShadow,
  getRadius,
  getFont,
  getCSSVar,
  brandColorClasses,
  buildBrandClass,
  isDarkMode,
  getCurrentThemeMode,
  formatColorWithOpacity,
  getContrastColor,
  applyThemeTransition,
  themeAwareClass,
} from "./utils";

// ===================================
// Re-exports for convenience
// ===================================

/**
 * Theme object with all values
 * Convenient access to all theme system components
 */
export const theme = {
  colors: {
    barq: {
      black: "#1e2024",
      white: "#ffffff",
      lightBlue: "#dff5f7",
      yellow: "#ffda00",
    },
  },
  spacing: {
    xs: "0.5rem",
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
  },
  shadows: {
    sm: "0 2px 8px rgba(30, 32, 36, 0.08)",
    md: "0 4px 16px rgba(30, 32, 36, 0.12)",
    lg: "0 8px 32px rgba(30, 32, 36, 0.16)",
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
  fonts: {
    barq: '"Graphik", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    barqCode: '"Fira Code", "Monaco", "Consolas", monospace',
  },
} as const;
