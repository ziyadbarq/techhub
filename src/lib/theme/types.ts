/**
 * Theme System Types
 *
 * TypeScript type definitions for the theme system.
 * Provides type safety for theme tokens, colors, and design system values.
 *
 * @module theme/types
 */

/**
 * barq Brand Color Names
 * Core palette colors from the barq design system
 */
export type BarqColorName = "black" | "white" | "light-blue" | "yellow";

/**
 * barq Brand Colors
 * Hex color values for the barq brand palette
 */
export type BarqColor = {
  readonly black: "#1e2024";
  readonly white: "#ffffff";
  readonly "light-blue": "#dff5f7";
  readonly yellow: "#ffda00";
};

/**
 * Semantic Theme Color Names
 * Design system semantic color tokens (shadcn/ui compatible)
 */
export type SemanticColorName =
  | "background"
  | "foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "accent"
  | "accent-foreground"
  | "destructive"
  | "destructive-foreground"
  | "success"
  | "success-foreground"
  | "warning"
  | "warning-foreground"
  | "info"
  | "info-foreground"
  | "border"
  | "input"
  | "ring";

/**
 * Chart Color Names
 * Design tokens for data visualization charts
 */
export type ChartColorName =
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5";

/**
 * Sidebar Color Names
 * Design tokens for sidebar components
 */
export type SidebarColorName =
  | "sidebar"
  | "sidebar-foreground"
  | "sidebar-primary"
  | "sidebar-primary-foreground"
  | "sidebar-accent"
  | "sidebar-accent-foreground"
  | "sidebar-border"
  | "sidebar-ring";

/**
 * All Theme Color Names
 * Union of all available color tokens in the theme system
 */
export type ThemeColorName =
  | SemanticColorName
  | ChartColorName
  | SidebarColorName
  | `barq-${BarqColorName}`;

/**
 * Brand Spacing Scale
 * Design tokens for consistent spacing
 */
export type SpacingScale = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Brand Spacing Values
 * Pixel/rem values for spacing tokens
 */
export type SpacingValue = {
  readonly xs: "0.5rem";
  readonly sm: "1rem";
  readonly md: "1.5rem";
  readonly lg: "2rem";
  readonly xl: "3rem";
};

/**
 * Shadow Scale
 * Design tokens for elevation/shadow system
 */
export type ShadowScale = "sm" | "md" | "lg";

/**
 * Shadow Values
 * CSS shadow definitions for barq brand
 */
export type ShadowValue = {
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
};

/**
 * Border Radius Scale
 * Design tokens for border radius system
 */
export type RadiusScale = "sm" | "md" | "lg";

/**
 * Border Radius Values
 * Pixel values for border radius tokens
 */
export type RadiusValue = {
  readonly sm: "4px";
  readonly md: "8px";
  readonly lg: "12px";
};

/**
 * Font Family Names
 * Typography font stack identifiers
 */
export type FontFamilyName = "barq" | "barq-code";

/**
 * Font Family Values
 * CSS font-family definitions
 */
export type FontFamilyValue = {
  readonly barq: string;
  readonly "barq-code": string;
};

/**
 * Theme Mode
 * Available theme modes for the application
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Theme Configuration
 * Complete theme configuration object
 */
export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    semantic: Record<SemanticColorName, string>;
    chart: Record<ChartColorName, string>;
    sidebar: Record<SidebarColorName, string>;
    brand: BarqColor;
  };
  spacing: SpacingValue;
  shadows: ShadowValue;
  radius: RadiusValue;
  fonts: FontFamilyValue;
}

/**
 * Design Token
 * Generic design token type with metadata
 */
export interface DesignToken<T = string> {
  value: T;
  variable: string;
  description?: string;
}

/**
 * Theme Utilities Return Types
 */
export interface ThemeUtils {
  getColor: (name: ThemeColorName) => string;
  getSpacing: (scale: SpacingScale) => string;
  getShadow: (scale: ShadowScale) => string;
  getRadius: (scale: RadiusScale) => string;
  getFont: (name: FontFamilyName) => string;
}
