/**
 * Theme Constants
 *
 * Type-safe constants for the theme system.
 * Single source of truth for brand colors and design tokens.
 *
 * @module theme/constants
 */

import type {
  BarqColor,
  SpacingValue,
  ShadowValue,
  RadiusValue,
  FontFamilyValue,
} from "./types";

/**
 * barq Brand Colors
 *
 * Core brand color palette. These are the foundational colors
 * that define the barq brand identity.
 *
 * @constant
 * @readonly
 */
export const BARQ_COLORS: BarqColor = {
  black: "#1e2024",
  white: "#ffffff",
  "light-blue": "#dff5f7",
  yellow: "#ffda00",
} as const;

/**
 * Brand Spacing Scale
 *
 * Consistent spacing system based on the barq design system.
 * Use these values for margins, padding, and gaps.
 *
 * @constant
 * @readonly
 */
export const BARQ_SPACING: SpacingValue = {
  xs: "0.5rem", // 8px
  sm: "1rem", // 16px
  md: "1.5rem", // 24px
  lg: "2rem", // 32px
  xl: "3rem", // 48px
} as const;

/**
 * Brand Shadow System
 *
 * Elevation system using box-shadow.
 * Provides consistent depth and hierarchy.
 *
 * @constant
 * @readonly
 */
export const BARQ_SHADOWS: ShadowValue = {
  sm: "0 2px 8px rgba(30, 32, 36, 0.08)",
  md: "0 4px 16px rgba(30, 32, 36, 0.12)",
  lg: "0 8px 32px rgba(30, 32, 36, 0.16)",
} as const;

/**
 * Brand Border Radius
 *
 * Consistent border radius system for rounded corners.
 *
 * @constant
 * @readonly
 */
export const BARQ_RADIUS: RadiusValue = {
  sm: "4px",
  md: "8px",
  lg: "12px",
} as const;

/**
 * Brand Typography
 *
 * Font family definitions for the barq brand.
 *
 * @constant
 * @readonly
 */
export const BARQ_FONTS: FontFamilyValue = {
  barq: '"Graphik", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  "barq-code": '"Fira Code", "Monaco", "Consolas", monospace',
} as const;

/**
 * CSS Variable Names
 *
 * CSS custom property names for theme tokens.
 * Use these to access theme values in CSS.
 *
 * @constant
 * @readonly
 */
export const CSS_VARIABLES = {
  // Brand Colors
  colors: {
    barqBlack: "--color-barq-black",
    barqWhite: "--color-barq-white",
    barqLightBlue: "--color-barq-light-blue",
    barqYellow: "--color-barq-yellow",
    brandPrimary: "--color-brand-primary",
    brandSecondary: "--color-brand-secondary",
    brandText: "--color-brand-text",
    brandSurface: "--color-brand-surface",
  },

  // Semantic Colors
  semantic: {
    background: "--background",
    foreground: "--foreground",
    card: "--card",
    cardForeground: "--card-foreground",
    popover: "--popover",
    popoverForeground: "--popover-foreground",
    primary: "--primary",
    primaryForeground: "--primary-foreground",
    secondary: "--secondary",
    secondaryForeground: "--secondary-foreground",
    muted: "--muted",
    mutedForeground: "--muted-foreground",
    accent: "--accent",
    accentForeground: "--accent-foreground",
    destructive: "--destructive",
    destructiveForeground: "--destructive-foreground",
    success: "--success",
    successForeground: "--success-foreground",
    warning: "--warning",
    warningForeground: "--warning-foreground",
    info: "--info",
    infoForeground: "--info-foreground",
    border: "--border",
    input: "--input",
    ring: "--ring",
  },

  // Spacing
  spacing: {
    xs: "--spacing-barq-xs",
    sm: "--spacing-barq-sm",
    md: "--spacing-barq-md",
    lg: "--spacing-barq-lg",
    xl: "--spacing-barq-xl",
  },

  // Shadows
  shadows: {
    sm: "--shadow-barq-sm",
    md: "--shadow-barq-md",
    lg: "--shadow-barq-lg",
  },

  // Radius
  radius: {
    sm: "--radius-barq-sm",
    md: "--radius-barq-md",
    lg: "--radius-barq-lg",
  },

  // Fonts
  fonts: {
    barq: "--font-barq",
    barqCode: "--font-barq-code",
  },
} as const;

/**
 * Tailwind Class Name Mappings
 *
 * Common Tailwind utility class combinations for brand colors.
 * Promotes consistency and DRY principles.
 *
 * @constant
 * @readonly
 */
export const BRAND_CLASSES = {
  // Primary brand color (yellow)
  primary: {
    text: "text-barq-yellow",
    bg: "bg-barq-yellow",
    bgSubtle: "bg-barq-yellow/10",
    bgHover: "hover:bg-barq-yellow/20",
    border: "border-barq-yellow",
    borderSubtle: "border-barq-yellow/30",
  },

  // Secondary brand color (light blue)
  secondary: {
    text: "text-barq-light-blue",
    bg: "bg-barq-light-blue",
    bgSubtle: "bg-barq-light-blue/20",
    bgHover: "hover:bg-barq-light-blue/30",
    border: "border-barq-light-blue",
    borderSubtle: "border-barq-light-blue/30",
  },

  // Brand text color (black)
  text: {
    default: "text-barq-black",
    onPrimary: "text-barq-black", // Black text on yellow
    onSecondary: "text-barq-black", // Black text on light blue
  },

  // Brand surface color (white)
  surface: {
    default: "bg-barq-white",
    text: "text-barq-black",
  },
} as const;

/**
 * Theme Transition Configuration
 *
 * Smooth transitions for theme changes.
 *
 * @constant
 * @readonly
 */
export const THEME_TRANSITION = {
  duration: 200, // milliseconds
  easing: "ease-in-out",
  properties: ["background-color", "color", "border-color"],
} as const;
