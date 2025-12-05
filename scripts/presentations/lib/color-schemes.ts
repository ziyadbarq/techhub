/**
 * Color Schemes Configuration
 *
 * Centralized color definitions following DRY principle
 * Each scheme is WCAG compliant and tested for contrast ratios
 * Uses barq brand colors: Yellow (#ffda00), Light Blue (#dff5f7)
 */

import type { ColorScheme } from "./base-presentation";

/**
 * Standard TechHub Color Scheme
 * Matches the application's dark mode from globals.css
 * Features barq brand yellow (#ffda00) as primary accent
 */
export const STANDARD_COLORS: ColorScheme = {
  // Core backgrounds
  background: "#333333", // oklch(0.2 0 0) - dark gray background
  card: "#404040", // oklch(0.25 0 0) - medium-dark gray

  // Text colors
  foreground: "#FAFAFA", // oklch(0.985 0 0) - near white text
  muted: "#B5B5B5", // oklch(0.708 0 0) - muted gray
  subtle: "#B5B5B5", // Same as muted for standard

  // UI elements
  primary: "#EBEBEB", // oklch(0.922 0 0) - primary gray
  accent: "#4D4D4D", // oklch(0.3 0 0) - accent gray
  border: "#404040",

  // Semantic colors
  success: "#4CAF50", // oklch(0.68 0.19 145) - green
  warning: "#FFC107", // oklch(0.76 0.17 65) - amber
  info: "#2196F3", // oklch(0.61 0.24 255) - blue
  error: "#EF4444", // Red

  // Chart colors - featuring barq brand yellow
  chart1: "#ffda00", // barq BRAND YELLOW (primary accent)
  chart2: "#dff5f7", // barq brand light blue
  chart3: "#fbbf24", // oklch(0.769 0.188 70.08) - amber (from app)
  chart4: "#8B5CF6", // oklch(0.627 0.265 303.9) - violet
  chart5: "#EF4444", // oklch(0.645 0.246 16.439) - red
};

/**
 * Get color scheme by name
 */
export function getColorScheme(_name: "standard"): ColorScheme {
  return STANDARD_COLORS;
}
