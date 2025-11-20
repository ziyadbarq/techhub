/**
 * Design Tokens
 *
 * Design token system providing structured access to theme values.
 * Implements design token specification for scalable design systems.
 *
 * @module theme/tokens
 */

import type { DesignToken } from "./types";
import {
  BARQ_COLORS,
  BARQ_SPACING,
  BARQ_SHADOWS,
  BARQ_RADIUS,
  BARQ_FONTS,
  CSS_VARIABLES,
} from "./constants";

/**
 * Color Tokens
 *
 * Structured design tokens for brand colors with metadata.
 */
export const colorTokens = {
  barq: {
    black: {
      value: BARQ_COLORS.black,
      variable: CSS_VARIABLES.colors.barqBlack,
      description: "barq brand black - primary text and dark surfaces",
    },
    white: {
      value: BARQ_COLORS.white,
      variable: CSS_VARIABLES.colors.barqWhite,
      description: "barq brand white - light surfaces and backgrounds",
    },
    lightBlue: {
      value: BARQ_COLORS["light-blue"],
      variable: CSS_VARIABLES.colors.barqLightBlue,
      description: "barq brand light blue - secondary accent color",
    },
    yellow: {
      value: BARQ_COLORS.yellow,
      variable: CSS_VARIABLES.colors.barqYellow,
      description:
        "barq brand yellow - primary accent and call-to-action color",
    },
  },
  brand: {
    primary: {
      value: "var(--color-brand-primary)",
      variable: CSS_VARIABLES.colors.brandPrimary,
      description: "Primary brand color (maps to yellow)",
    },
    secondary: {
      value: "var(--color-brand-secondary)",
      variable: CSS_VARIABLES.colors.brandSecondary,
      description: "Secondary brand color (maps to light blue)",
    },
    text: {
      value: "var(--color-brand-text)",
      variable: CSS_VARIABLES.colors.brandText,
      description: "Brand text color (maps to black)",
    },
    surface: {
      value: "var(--color-brand-surface)",
      variable: CSS_VARIABLES.colors.brandSurface,
      description: "Brand surface color (maps to white)",
    },
  },
} as const satisfies Record<string, Record<string, DesignToken>>;

/**
 * Spacing Tokens
 *
 * Structured design tokens for spacing scale.
 */
export const spacingTokens = {
  xs: {
    value: BARQ_SPACING.xs,
    variable: CSS_VARIABLES.spacing.xs,
    description: "Extra small spacing (8px)",
  },
  sm: {
    value: BARQ_SPACING.sm,
    variable: CSS_VARIABLES.spacing.sm,
    description: "Small spacing (16px)",
  },
  md: {
    value: BARQ_SPACING.md,
    variable: CSS_VARIABLES.spacing.md,
    description: "Medium spacing (24px)",
  },
  lg: {
    value: BARQ_SPACING.lg,
    variable: CSS_VARIABLES.spacing.lg,
    description: "Large spacing (32px)",
  },
  xl: {
    value: BARQ_SPACING.xl,
    variable: CSS_VARIABLES.spacing.xl,
    description: "Extra large spacing (48px)",
  },
} as const satisfies Record<string, DesignToken>;

/**
 * Shadow Tokens
 *
 * Structured design tokens for elevation/shadow system.
 */
export const shadowTokens = {
  sm: {
    value: BARQ_SHADOWS.sm,
    variable: CSS_VARIABLES.shadows.sm,
    description: "Small shadow - subtle elevation for cards and buttons",
  },
  md: {
    value: BARQ_SHADOWS.md,
    variable: CSS_VARIABLES.shadows.md,
    description: "Medium shadow - moderate elevation for dropdowns and modals",
  },
  lg: {
    value: BARQ_SHADOWS.lg,
    variable: CSS_VARIABLES.shadows.lg,
    description: "Large shadow - prominent elevation for overlays and dialogs",
  },
} as const satisfies Record<string, DesignToken>;

/**
 * Radius Tokens
 *
 * Structured design tokens for border radius system.
 */
export const radiusTokens = {
  sm: {
    value: BARQ_RADIUS.sm,
    variable: CSS_VARIABLES.radius.sm,
    description: "Small radius (4px) - subtle rounded corners",
  },
  md: {
    value: BARQ_RADIUS.md,
    variable: CSS_VARIABLES.radius.md,
    description: "Medium radius (8px) - moderate rounded corners",
  },
  lg: {
    value: BARQ_RADIUS.lg,
    variable: CSS_VARIABLES.radius.lg,
    description: "Large radius (12px) - prominent rounded corners",
  },
} as const satisfies Record<string, DesignToken>;

/**
 * Typography Tokens
 *
 * Structured design tokens for font families.
 */
export const typographyTokens = {
  barq: {
    value: BARQ_FONTS.barq,
    variable: CSS_VARIABLES.fonts.barq,
    description: "barq brand font stack - primary text and headings",
  },
  barqCode: {
    value: BARQ_FONTS["barq-code"],
    variable: CSS_VARIABLES.fonts.barqCode,
    description: "barq code font stack - monospace for code blocks",
  },
} as const satisfies Record<string, DesignToken>;

/**
 * All Design Tokens
 *
 * Centralized export of all design tokens.
 * Provides single source of truth for the entire design system.
 */
export const designTokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  shadows: shadowTokens,
  radius: radiusTokens,
  typography: typographyTokens,
} as const;

/**
 * Get Token Value
 *
 * Helper function to extract the value from a design token.
 *
 * @param token - Design token object
 * @returns The token value
 *
 * @example
 * ```ts
 * const yellow = getTokenValue(colorTokens.barq.yellow);
 * // Returns: "#ffda00"
 * ```
 */
export function getTokenValue<T>(token: DesignToken<T>): T {
  return token.value;
}

/**
 * Get Token Variable
 *
 * Helper function to extract the CSS variable name from a design token.
 *
 * @param token - Design token object
 * @returns The CSS variable name
 *
 * @example
 * ```ts
 * const yellowVar = getTokenVariable(colorTokens.barq.yellow);
 * // Returns: "--color-barq-yellow"
 * ```
 */
export function getTokenVariable(token: DesignToken): string {
  return token.variable;
}

/**
 * Get Token CSS Value
 *
 * Helper function to get the CSS var() expression for a design token.
 *
 * @param token - Design token object
 * @returns CSS var() expression
 *
 * @example
 * ```ts
 * const yellowCSS = getTokenCSSValue(colorTokens.barq.yellow);
 * // Returns: "var(--color-barq-yellow)"
 * ```
 */
export function getTokenCSSValue(token: DesignToken): string {
  return `var(${token.variable})`;
}
