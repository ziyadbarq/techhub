/**
 * Feature to Route Mappings
 * Maps feature flags to their corresponding routes and dependencies
 */

/**
 * Feature to routes mapping
 * Each feature controls access to one or more routes
 */
export const FEATURE_ROUTES: Record<string, string[]> = {
  // Layer 1 (Foundation)
  FOUNDATION: [
    "/organization-units",
    "/persons",
    "/locations",
    "/vendors",
    "/lifecycles",
    "/field-definitions",
  ],
  RBAC: ["/admin/users", "/admin/roles", "/admin/permissions"],
  FX_RATES: ["/fx-rates"],
  DATA_IMPORT: ["/data-import"],

  // Layer 2 (Asset Management)
  ASSETS: [
    "/assets",
    "/asset-categories",
    "/asset-models",
    "/asset-assignments",
  ],
  MAINTENANCE: ["/maintenance-schedules", "/maintenance-records"],
  INVENTORY: ["/stock-locations", "/stock-movements"],
  WARRANTIES: ["/warranties"],

  // Layer 3 (Advanced ITAM)
  CMDB: [
    "/configuration-items",
    "/ci-relationships",
    "/relationship-types",
    "/ci-classes",
    "/ci-class-fields",
    "/relationship-type-scopes",
  ],
  CONTRACTS: ["/contract-types", "/contracts"],
  LICENSES: [
    "/license-products",
    "/license-entitlements",
    "/license-allocations",
  ],
  SERVICES: [
    "/services",
    "/business-processes",
    "/service-infrastructure",
    "/service-asset",
  ],
  GOVERNANCE: [
    "/data-domains",
    "/data-ownerships",
    "/verification-campaigns",
    "/verification-items",
  ],
  ATTACHMENTS: ["/attachment-types", "/attachments"],
  ASSET_DISPOSALS: ["/asset-disposals"],
  ASSET_KITS: ["/asset-kits"],
  ASSET_RESERVATIONS: ["/asset-reservations"],
  REPORTS: ["/reports"],
};

/**
 * Feature dependencies
 * Each feature may depend on one or more other features being enabled
 */
export const FEATURE_DEPENDENCIES: Record<string, string[]> = {
  // Layer 1 dependencies
  DATA_IMPORT: ["FOUNDATION"],

  // Layer 2 dependencies
  MAINTENANCE: ["ASSETS"],
  INVENTORY: ["ASSETS"],
  WARRANTIES: ["ASSETS"],

  // Layer 3 dependencies
  CMDB: ["FOUNDATION"],
  CONTRACTS: ["FOUNDATION"],
  LICENSES: ["FOUNDATION"],
  SERVICES: ["CMDB", "FOUNDATION"],
  GOVERNANCE: ["FOUNDATION"],
  ASSET_DISPOSALS: ["ASSETS"],
  ASSET_KITS: ["ASSETS"],
  ASSET_RESERVATIONS: ["ASSETS"],
  REPORTS: ["FOUNDATION"],
};

/**
 * Get all routes controlled by a feature
 */
export function getFeatureRoutes(featureName: string): string[] {
  return FEATURE_ROUTES[featureName.toUpperCase()] ?? [];
}

/**
 * Get all dependencies for a feature
 */
export function getFeatureDependencies(featureName: string): string[] {
  return FEATURE_DEPENDENCIES[featureName.toUpperCase()] ?? [];
}

/**
 * Find which feature controls a given route
 * @param route - The route path (e.g., "/assets", "/contracts")
 * @returns Feature name or null if not found
 */
export function getFeatureByRoute(route: string): string | null {
  for (const [feature, routes] of Object.entries(FEATURE_ROUTES)) {
    if (routes.includes(route)) {
      return feature;
    }
  }
  return null;
}

/**
 * Check if a route is controlled by a feature flag
 */
export function isFeatureControlledRoute(route: string): boolean {
  return getFeatureByRoute(route) !== null;
}
