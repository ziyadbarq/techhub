/**
 * Seed Module Dependencies and Metadata
 *
 * Defines the dependency graph for database seeding modules.
 * Used by interactive seed script to validate selections and ensure
 * modules are seeded in the correct order.
 */

export enum SeedModule {
  // Production modules (config/reference data)
  RBAC = "RBAC",
  FOUNDATION = "FOUNDATION",
  BUSINESS_PROCESSES = "BUSINESS_PROCESSES",
  ASSET_CONFIG = "ASSET_CONFIG",
  SERVICES = "SERVICES",
  CMDB = "CMDB",
  ATTACHMENTS_GOVERNANCE = "ATTACHMENTS_GOVERNANCE",

  // Demo-only modules
  DEMO_PERSONS = "DEMO_PERSONS",
  DEMO_ASSETS = "DEMO_ASSETS",
  SERVICE_OWNERS = "SERVICE_OWNERS",
  WARRANTIES_MAINTENANCE = "WARRANTIES_MAINTENANCE",
  LAYER3_ITAM = "LAYER3_ITAM",
  AI_PROMPTS_TASKS = "AI_PROMPTS_TASKS",
}

export interface SeedModuleMetadata {
  key: SeedModule;
  name: string;
  description: string;
  estimatedTime: number; // seconds
  dependencies: SeedModule[];
  tables: string[]; // Tables this module affects (for cleanup)
}

/**
 * Module metadata with dependencies and affected tables
 */
export const MODULE_METADATA: Record<SeedModule, SeedModuleMetadata> = {
  // ==============================================
  // Production Modules (config/reference data)
  // ==============================================

  [SeedModule.RBAC]: {
    key: SeedModule.RBAC,
    name: "RBAC System",
    description:
      "Permissions, roles, and access control (269 permissions, 10 roles)",
    estimatedTime: 2,
    dependencies: [],
    tables: [
      "rbac_user_roles",
      "rbac_role_permissions",
      "rbac_permissions",
      "rbac_roles",
    ],
  },

  [SeedModule.FOUNDATION]: {
    key: SeedModule.FOUNDATION,
    name: "Foundation Config",
    description:
      "Vendors, locations, org units, lifecycle models (no demo persons)",
    estimatedTime: 2,
    dependencies: [SeedModule.RBAC],
    tables: [
      "FieldDefinition",
      "Location",
      "OrganizationUnit",
      "VendorContact",
      "Vendor",
      "LifecycleTransition",
      "LifecycleState",
      "LifecycleModel",
      "Role",
      "ExchangeRate",
      "CodeSequence",
    ],
  },

  [SeedModule.BUSINESS_PROCESSES]: {
    key: SeedModule.BUSINESS_PROCESSES,
    name: "Business Processes",
    description: "25 business processes for service management",
    estimatedTime: 1,
    dependencies: [SeedModule.RBAC],
    tables: ["BusinessProcess"],
  },

  [SeedModule.ASSET_CONFIG]: {
    key: SeedModule.ASSET_CONFIG,
    name: "Asset Config",
    description: "Asset categories, models, stock locations (no demo assets)",
    estimatedTime: 1,
    dependencies: [SeedModule.RBAC, SeedModule.FOUNDATION],
    tables: [
      "AssetCategoryField",
      "AssetModel",
      "AssetCategory",
      "StockLocation",
    ],
  },

  [SeedModule.SERVICES]: {
    key: SeedModule.SERVICES,
    name: "Demo Services",
    description:
      "Demo services for development (production: use import-services.ts script)",
    estimatedTime: 2,
    dependencies: [
      SeedModule.RBAC,
      SeedModule.FOUNDATION,
      SeedModule.BUSINESS_PROCESSES,
    ],
    tables: ["ServiceInfrastructure", "Service"],
  },

  [SeedModule.CMDB]: {
    key: SeedModule.CMDB,
    name: "CMDB Config",
    description: "CI classes, relationship types (no demo CIs)",
    estimatedTime: 1,
    dependencies: [SeedModule.RBAC, SeedModule.FOUNDATION],
    tables: [
      "RelationshipType",
      "CIClassField",
      "CIClass",
      "RelationshipTypeScope",
    ],
  },

  [SeedModule.ATTACHMENTS_GOVERNANCE]: {
    key: SeedModule.ATTACHMENTS_GOVERNANCE,
    name: "Attachments & Governance",
    description: "Attachment types, data domains, verification campaigns",
    estimatedTime: 1,
    dependencies: [SeedModule.RBAC],
    tables: [
      "Attachment",
      "AttachmentType",
      "VerificationItem",
      "VerificationCampaign",
      "DataOwnership",
      "DataDomain",
    ],
  },

  // ==============================================
  // Demo-only Modules
  // ==============================================

  [SeedModule.DEMO_PERSONS]: {
    key: SeedModule.DEMO_PERSONS,
    name: "Demo Persons",
    description: "21 demo persons for development (production uses Graph sync)",
    estimatedTime: 1,
    dependencies: [SeedModule.RBAC, SeedModule.FOUNDATION],
    tables: ["Person"],
  },

  [SeedModule.DEMO_ASSETS]: {
    key: SeedModule.DEMO_ASSETS,
    name: "Demo Assets",
    description: "50+ demo assets with assignments and stock movements",
    estimatedTime: 3,
    dependencies: [SeedModule.ASSET_CONFIG, SeedModule.DEMO_PERSONS],
    tables: ["AssetAssignment", "StockMovement", "Asset"],
  },

  [SeedModule.SERVICE_OWNERS]: {
    key: SeedModule.SERVICE_OWNERS,
    name: "Service Owners",
    description:
      "Service ownership assignments (links services to demo persons)",
    estimatedTime: 1,
    dependencies: [SeedModule.SERVICES, SeedModule.DEMO_PERSONS],
    tables: ["ServiceOwnership"],
  },

  [SeedModule.WARRANTIES_MAINTENANCE]: {
    key: SeedModule.WARRANTIES_MAINTENANCE,
    name: "Warranties & Maintenance",
    description: "Warranty records and maintenance schedules for demo assets",
    estimatedTime: 2,
    dependencies: [SeedModule.DEMO_ASSETS],
    tables: ["MaintenanceRecord", "MaintenanceSchedule", "Warranty"],
  },

  [SeedModule.LAYER3_ITAM]: {
    key: SeedModule.LAYER3_ITAM,
    name: "Advanced ITAM",
    description: "Asset disposals, kits, reservations, licenses, contracts",
    estimatedTime: 2,
    dependencies: [SeedModule.DEMO_ASSETS, SeedModule.CMDB],
    tables: [
      // Disposals
      "DisposalDocument",
      "DisposalApproval",
      "AssetDisposal",
      // Kits
      "AssetKitCheckoutItem",
      "AssetKitCheckout",
      "AssetKitItem",
      "AssetKit",
      // Reservations
      "AssetReservationConflict",
      "AssetReservation",
      // Contracts
      "ContractLinkedObject",
      "Contract",
      "ContractType",
      // Licenses
      "LicenseAllocation",
      "LicenseEntitlement",
      "LicenseProductField",
      "LicenseProduct",
      // Demo CIs
      "CIRelationship",
      "ConfigurationItem",
    ],
  },

  [SeedModule.AI_PROMPTS_TASKS]: {
    key: SeedModule.AI_PROMPTS_TASKS,
    name: "Example Tasks",
    description: "Example tasks for testing",
    estimatedTime: 1,
    dependencies: [SeedModule.RBAC, SeedModule.FOUNDATION],
    tables: ["Task"],
  },
};

/**
 * Resolve dependencies for a set of selected modules
 * Returns all modules needed (selected + their dependencies) in correct execution order
 */
export function resolveDependencies(
  selectedModules: SeedModule[],
): SeedModule[] {
  const resolved = new Set<SeedModule>();
  const visiting = new Set<SeedModule>();

  function visit(seedModule: SeedModule) {
    if (resolved.has(seedModule)) return;
    if (visiting.has(seedModule)) {
      throw new Error(`Circular dependency detected involving ${seedModule}`);
    }

    visiting.add(seedModule);
    const metadata = MODULE_METADATA[seedModule];

    // Visit dependencies first
    for (const dep of metadata.dependencies) {
      visit(dep);
    }

    visiting.delete(seedModule);
    resolved.add(seedModule);
  }

  // Visit all selected modules
  for (const seedModule of selectedModules) {
    visit(seedModule);
  }

  return Array.from(resolved);
}

/**
 * Get all tables that need to be cleaned for the selected modules
 * Returns tables in reverse dependency order (safe deletion order)
 */
export function getTablesToCleanup(modules: SeedModule[]): string[] {
  const allTables = new Set<string>();

  // Collect all tables from selected modules
  for (const seedModule of modules) {
    const metadata = MODULE_METADATA[seedModule];
    for (const table of metadata.tables) {
      allTables.add(table);
    }
  }

  // Return in reverse order (reverse of module execution order)
  const executionOrder = resolveDependencies(modules);
  const reversedModules = [...executionOrder].reverse();

  const orderedTables: string[] = [];
  for (const seedModule of reversedModules) {
    const metadata = MODULE_METADATA[seedModule];
    for (const table of metadata.tables) {
      if (allTables.has(table) && !orderedTables.includes(table)) {
        orderedTables.push(table);
      }
    }
  }

  return orderedTables;
}

/**
 * Get missing dependencies for a set of selected modules
 */
export function getMissingDependencies(
  selectedModules: SeedModule[],
): SeedModule[] {
  const selected = new Set(selectedModules);
  const missing = new Set<SeedModule>();

  for (const seedModule of selectedModules) {
    const metadata = MODULE_METADATA[seedModule];
    for (const dep of metadata.dependencies) {
      if (!selected.has(dep)) {
        missing.add(dep);
      }
    }
  }

  return Array.from(missing);
}

/**
 * Validate module selection
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateSelection(selectedModules: SeedModule[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (selectedModules.length === 0) {
    errors.push("No modules selected");
    return { valid: false, errors, warnings };
  }

  // Check for missing dependencies
  const missing = getMissingDependencies(selectedModules);
  if (missing.length > 0) {
    const missingNames = missing.map((m) => MODULE_METADATA[m].name);
    errors.push(`Missing required dependencies: ${missingNames.join(", ")}`);
  }

  // Warnings for potentially incomplete setups
  const selected = new Set(selectedModules);

  if (
    selected.has(SeedModule.LAYER3_ITAM) &&
    !selected.has(SeedModule.DEMO_ASSETS)
  ) {
    warnings.push(
      "Layer 3 ITAM features require Demo Assets to be seeded for full functionality",
    );
  }

  if (
    selected.has(SeedModule.SERVICE_OWNERS) &&
    !selected.has(SeedModule.DEMO_PERSONS)
  ) {
    warnings.push("Service Owners require Demo Persons to be seeded");
  }

  if (
    selected.has(SeedModule.SERVICES) &&
    !selected.has(SeedModule.BUSINESS_PROCESSES)
  ) {
    warnings.push("Services module works best with Business Processes seeded");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate total estimated time for selected modules
 */
export function calculateEstimatedTime(modules: SeedModule[]): number {
  const resolved = resolveDependencies(modules);
  return resolved.reduce(
    (total, module) => total + MODULE_METADATA[module].estimatedTime,
    0,
  );
}

/**
 * Predefined presets for common seeding scenarios
 */
export interface SeedPreset {
  name: string;
  description: string;
  modules: SeedModule[];
}

export const BUILTIN_PRESETS: SeedPreset[] = [
  {
    name: "production",
    description:
      "Production-ready config only (no demo data). Use import scripts for real data.",
    modules: [
      SeedModule.RBAC,
      SeedModule.FOUNDATION,
      SeedModule.BUSINESS_PROCESSES,
      SeedModule.ASSET_CONFIG,
      SeedModule.CMDB,
      SeedModule.ATTACHMENTS_GOVERNANCE,
      // Note: SERVICES removed - use scripts/import-services.ts for real services
    ],
  },
  {
    name: "dev",
    description: "Full development environment with all demo data",
    modules: Object.values(SeedModule),
  },
];
