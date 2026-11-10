/**
 * Type-safe Feature Flag Keys
 *
 * Central registry of all feature flags in the system.
 * Use const assertion to create a union type from values.
 *
 * @example
 * ```typescript
 * import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
 *
 * // ✅ Type-safe usage
 * const isEnabled = useIsFeatureEnabled(FEATURE_FLAGS.LICENSE_MANAGEMENT);
 *
 * // ❌ TypeScript will catch typos
 * const isEnabled = useIsFeatureEnabled("LICENCES"); // Compile error!
 * ```
 */
export const FEATURE_FLAGS = {
  // System
  MAINTENANCE_MODE: "MAINTENANCE_MODE",

  // Layer 1 (Foundation)
  FOUNDATION: "FOUNDATION",
  RBAC: "RBAC",
  FX_RATES: "FX_RATES",
  DATA_IMPORT: "DATA_IMPORT",

  // Layer 2 (Assets & Inventory)
  ASSETS: "ASSETS",
  INVENTORY: "INVENTORY",
  WARRANTIES: "WARRANTIES",
  MAINTENANCE: "MAINTENANCE",

  // Layer 3 (Advanced ITAM & Extensions)
  ASSET_DISPOSALS: "ASSET_DISPOSALS",
  ASSET_KITS: "ASSET_KITS",
  ASSET_RESERVATIONS: "ASSET_RESERVATIONS",
  CMDB: "CMDB",
  CONTRACTS: "CONTRACTS",
  CONTRACT_MANAGEMENT: "CONTRACTS",
  LICENSES: "LICENSES",
  LICENSE_MANAGEMENT: "LICENSES",
  GOVERNANCE: "GOVERNANCE",
  ATTACHMENTS: "ATTACHMENTS",
  SERVICES: "SERVICES",
  SERVICE_MANAGEMENT: "SERVICES",
  SERVICE_HEALTH_SLA: "SERVICE_HEALTH_SLA",
  INTUNE: "INTUNE",
  OCI_SYNC: "OCI_SYNC",
  REPORTS: "REPORTS",

  // Workflow Engine (gates the entire /workflows module + cron jobs)
  WORKFLOW_ENGINE: "WORKFLOW_ENGINE",
  KNOWLEDGE_BASE: "KNOWLEDGE_BASE",
} as const;

/**
 * Type extracted from const assertion
 *
 * This creates a union type of all possible feature flag values.
 * TypeScript will enforce that only valid feature flag names can be used.
 */
export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/**
 * Type guard for runtime validation
 *
 * Use this to check if a string is a valid feature flag at runtime.
 *
 * @example
 * ```typescript
 * if (isValidFeatureFlag(userInput)) {
 *   // TypeScript knows userInput is FeatureFlagKey here
 *   const enabled = await isFeatureEnabled(userInput);
 * }
 * ```
 */
export function isValidFeatureFlag(flag: string): flag is FeatureFlagKey {
  return Object.values(FEATURE_FLAGS).includes(flag as FeatureFlagKey);
}
