/**
 * Entity Registry - Single source of truth for entities supporting custom fields
 *
 * This registry defines which entities can have custom field definitions attached.
 * It provides metadata for UI components and validation.
 *
 * @remarks
 * - Keys match Prisma model names exactly (PascalCase)
 * - Only business entities included (not system entities like Permission, RolePermission)
 * - Ordered by category, then alphabetically within category
 */

/**
 * Categories for organizing entities in the UI
 */
export type EntityCategory =
  | "ASSET_MANAGEMENT"
  | "PEOPLE_ORGANIZATION"
  | "INFRASTRUCTURE"
  | "VENDORS_CONTRACTS"
  | "CMDB"
  | "LICENSING"
  | "MAINTENANCE";

/**
 * Display labels for entity categories
 */
export const ENTITY_CATEGORY_LABELS: Record<EntityCategory, string> = {
  ASSET_MANAGEMENT: "Asset Management",
  PEOPLE_ORGANIZATION: "People & Organization",
  INFRASTRUCTURE: "Infrastructure",
  VENDORS_CONTRACTS: "Vendors & Contracts",
  CMDB: "Configuration Management",
  LICENSING: "License Management",
  MAINTENANCE: "Maintenance",
} as const;

/**
 * Registry entry for an entity that supports custom fields
 */
export interface EntityRegistryEntry {
  /** Unique key matching Prisma model name (e.g., "Asset", "Person") */
  key: string;
  /** Human-readable singular name */
  displayName: string;
  /** Human-readable plural name */
  pluralName: string;
  /** Category for grouping in UI */
  category: EntityCategory;
  /** Brief description of the entity */
  description: string;
  /** Whether custom fields are currently enabled for this entity */
  supportsCustomFields: boolean;
}

/**
 * Central registry of entities that can have custom field definitions
 */
export const ENTITY_REGISTRY: readonly EntityRegistryEntry[] = [
  // ============================================
  // Asset Management
  // ============================================
  {
    key: "Asset",
    displayName: "Asset",
    pluralName: "Assets",
    category: "ASSET_MANAGEMENT",
    description: "Physical or virtual IT assets",
    supportsCustomFields: true,
  },
  {
    key: "AssetCategory",
    displayName: "Asset Category",
    pluralName: "Asset Categories",
    category: "ASSET_MANAGEMENT",
    description: "Classification categories for assets",
    supportsCustomFields: true,
  },
  {
    key: "AssetModel",
    displayName: "Asset Model",
    pluralName: "Asset Models",
    category: "ASSET_MANAGEMENT",
    description: 'Specific models of assets (e.g., MacBook Pro 16")',
    supportsCustomFields: true,
  },
  {
    key: "AssetKit",
    displayName: "Asset Kit",
    pluralName: "Asset Kits",
    category: "ASSET_MANAGEMENT",
    description: "Bundled collections of assets",
    supportsCustomFields: true,
  },

  // ============================================
  // People & Organization
  // ============================================
  {
    key: "Person",
    displayName: "Person",
    pluralName: "People",
    category: "PEOPLE_ORGANIZATION",
    description: "Employees and external contacts",
    supportsCustomFields: true,
  },
  {
    key: "OrganizationUnit",
    displayName: "Organization Unit",
    pluralName: "Organization Units",
    category: "PEOPLE_ORGANIZATION",
    description: "Departments, teams, and business units",
    supportsCustomFields: true,
  },
  {
    key: "Role",
    displayName: "Role",
    pluralName: "Roles",
    category: "PEOPLE_ORGANIZATION",
    description: "Job roles and access control roles",
    supportsCustomFields: true,
  },

  // ============================================
  // Infrastructure
  // ============================================
  {
    key: "Location",
    displayName: "Location",
    pluralName: "Locations",
    category: "INFRASTRUCTURE",
    description: "Physical and logical locations",
    supportsCustomFields: true,
  },
  {
    key: "StockLocation",
    displayName: "Stock Location",
    pluralName: "Stock Locations",
    category: "INFRASTRUCTURE",
    description: "Inventory storage locations",
    supportsCustomFields: true,
  },

  // ============================================
  // Vendors & Contracts
  // ============================================
  {
    key: "Vendor",
    displayName: "Vendor",
    pluralName: "Vendors",
    category: "VENDORS_CONTRACTS",
    description: "Suppliers, manufacturers, and service providers",
    supportsCustomFields: true,
  },
  {
    key: "Contract",
    displayName: "Contract",
    pluralName: "Contracts",
    category: "VENDORS_CONTRACTS",
    description: "Service and procurement contracts",
    supportsCustomFields: true,
  },
  {
    key: "ContractType",
    displayName: "Contract Type",
    pluralName: "Contract Types",
    category: "VENDORS_CONTRACTS",
    description: "Classification of contract types",
    supportsCustomFields: true,
  },

  // ============================================
  // CMDB
  // ============================================
  {
    key: "ConfigurationItem",
    displayName: "Configuration Item",
    pluralName: "Configuration Items",
    category: "CMDB",
    description: "IT infrastructure components",
    supportsCustomFields: true,
  },
  {
    key: "CIClass",
    displayName: "CI Class",
    pluralName: "CI Classes",
    category: "CMDB",
    description: "Classification of configuration items",
    supportsCustomFields: true,
  },
  {
    key: "Service",
    displayName: "Service",
    pluralName: "Services",
    category: "CMDB",
    description: "IT and business services",
    supportsCustomFields: true,
  },
  {
    key: "BusinessProcess",
    displayName: "Business Process",
    pluralName: "Business Processes",
    category: "CMDB",
    description: "Organizational business processes",
    supportsCustomFields: true,
  },

  // ============================================
  // Licensing
  // ============================================
  {
    key: "LicenseProduct",
    displayName: "License Product",
    pluralName: "License Products",
    category: "LICENSING",
    description: "Software products requiring licenses",
    supportsCustomFields: true,
  },
  {
    key: "LicenseEntitlement",
    displayName: "License Entitlement",
    pluralName: "License Entitlements",
    category: "LICENSING",
    description: "Purchased license quantities",
    supportsCustomFields: true,
  },

  // ============================================
  // Maintenance
  // ============================================
  {
    key: "MaintenanceSchedule",
    displayName: "Maintenance Schedule",
    pluralName: "Maintenance Schedules",
    category: "MAINTENANCE",
    description: "Scheduled maintenance plans",
    supportsCustomFields: true,
  },
  {
    key: "Warranty",
    displayName: "Warranty",
    pluralName: "Warranties",
    category: "MAINTENANCE",
    description: "Asset warranty information",
    supportsCustomFields: true,
  },
] as const;

/**
 * Get all entities that support custom fields
 */
export function getCustomFieldsEnabledEntities(): readonly EntityRegistryEntry[] {
  return ENTITY_REGISTRY.filter((e) => e.supportsCustomFields);
}

/**
 * Get an entity by its key
 */
export function getEntityByKey(key: string): EntityRegistryEntry | undefined {
  return ENTITY_REGISTRY.find((e) => e.key === key);
}

/**
 * Get all entities in a specific category
 */
export function getEntitiesByCategory(
  category: EntityCategory,
): readonly EntityRegistryEntry[] {
  return ENTITY_REGISTRY.filter((e) => e.category === category);
}

/**
 * Check if an entity key is valid
 */
export function isValidEntityKey(key: string): boolean {
  return ENTITY_REGISTRY.some((e) => e.key === key);
}

/**
 * Get all valid entity keys as a readonly array (for Zod validation)
 */
export function getValidEntityKeys(): readonly string[] {
  return ENTITY_REGISTRY.map((e) => e.key);
}
