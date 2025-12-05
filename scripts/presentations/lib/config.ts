/**
 * Presentation Configuration
 *
 * Centralized configuration following Single Responsibility Principle
 * Separates concerns: typography, spacing, page layout, branding
 */

import type {
  TypographyScale,
  SpacingScale,
  PageConfig,
  PresentationConfig,
} from "./base-presentation";
import { getColorScheme } from "./color-schemes";

/**
 * Typography Scale - Research-based sizing
 * Based on WCAG guidelines and vision science research
 */
export const TYPOGRAPHY: TypographyScale = {
  hero: 48, // Main titles
  h1: 36, // Primary headings
  h2: 24, // Secondary headings
  h3: 20, // Tertiary headings
  body: 16, // Body text (WCAG minimum)
  small: 14, // Small text
  tiny: 12, // Captions/footnotes
};

/**
 * Spacing Scale - 8px grid system
 * Consistent spacing for visual rhythm
 */
export const SPACING: SpacingScale = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
};

/**
 * Page Configuration - A4 Landscape
 */
export const PAGE_CONFIG: PageConfig = {
  width: 842, // A4 landscape
  height: 595,
  margin: 60,
  contentWidth: 722, // width - (margin * 2)
  contentHeight: 475, // height - (margin * 2)
};

/**
 * Branding Configuration
 */
export const BRANDING = {
  logo: "{barq}",
  appName: "TechHub",
  tagline: "Enterprise CMDB & ITAM System",
  copyright: "© 2025 barq. All rights reserved.",
};

/**
 * Create presentation configuration
 * Factory function following Dependency Inversion Principle
 */
export function createPresentationConfig(): PresentationConfig {
  return {
    colors: getColorScheme("standard"),
    typography: TYPOGRAPHY,
    spacing: SPACING,
    page: PAGE_CONFIG,
    branding: BRANDING,
  };
}
