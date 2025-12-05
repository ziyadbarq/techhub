/**
 * TechHub Presentation Library
 *
 * Exports all presentation components following clean architecture
 */

// Base classes
export { BasePresentation } from "./base-presentation";
export type {
  ColorScheme,
  TypographyScale,
  SpacingScale,
  PageConfig,
  PresentationConfig,
} from "./base-presentation";

// Presentation implementations
export { StandardPresentation } from "./standard-presentation";
export { ExecutivePresentation } from "./executive-presentation";

// Configuration
export {
  TYPOGRAPHY,
  SPACING,
  PAGE_CONFIG,
  BRANDING,
  createPresentationConfig,
} from "./config";

// Color schemes
export { STANDARD_COLORS, getColorScheme } from "./color-schemes";
