/**
 * Org Chart Configuration
 * Centralized configuration for dimensions, spacing, and styling
 * Makes the org chart customizable and maintainable
 */

export interface OrgChartDimensions {
  nodeWidth: number;
  nodeHeight: number;
}

export interface OrgChartSpacing {
  horizontal: number;
  vertical: number;
  treeGap: number;
}

export interface OrgChartColors {
  // Node colors
  nodeStroke: string;
  nodeHighlight: string;
  // Edge colors
  edge: string;
  edgeHighlight: string;
  // Minimap colors
  minimap: string;
}

export interface OrgChartFitView {
  padding: number;
  includeHiddenNodes: boolean;
}

export interface OrgChartZoom {
  min: number;
  max: number;
}

export interface OrgChartMarker {
  width: number;
  height: number;
}

export interface OrgChartConfig {
  dimensions: OrgChartDimensions;
  spacing: OrgChartSpacing;
  colors: OrgChartColors;
  fitView: OrgChartFitView;
  zoom: OrgChartZoom;
  marker: OrgChartMarker;
}

/**
 * Default org chart configuration
 * Note: SVG elements (minimap, edges) require hex colors - CSS variables don't work in SVG inline styles
 */
export const DEFAULT_ORG_CHART_CONFIG: OrgChartConfig = {
  dimensions: {
    nodeWidth: 192, // w-48 = 12rem = 192px
    nodeHeight: 120,
  },
  spacing: {
    horizontal: 40,
    vertical: 80,
    treeGap: 80, // Gap between separate trees (multiple roots)
  },
  colors: {
    // These use CSS variables (work in HTML)
    nodeStroke: "hsl(var(--border))",
    nodeHighlight: "#3b82f6", // blue-500 for highlight
    // These use hex colors (required for SVG)
    edge: "#888888",
    edgeHighlight: "#3b82f6", // blue-500
    minimap: "#d4d4d8", // zinc-300 - visible in both light/dark
  },
  fitView: {
    padding: 0.3,
    includeHiddenNodes: false,
  },
  zoom: {
    min: 0.05,
    max: 3,
  },
  marker: {
    width: 15,
    height: 15,
  },
} as const;

/**
 * Calculate total node width including padding
 */
export function getNodeTotalWidth(config: OrgChartConfig): number {
  return config.dimensions.nodeWidth + config.spacing.horizontal;
}

/**
 * Calculate total node height including padding
 */
export function getNodeTotalHeight(config: OrgChartConfig): number {
  return config.dimensions.nodeHeight + config.spacing.vertical;
}
