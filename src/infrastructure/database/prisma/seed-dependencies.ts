/**
 * Seed Module Dependencies and Metadata
 *
 * Defines the dependency graph for database seeding modules.
 * Used by interactive seed script to validate selections and ensure
 * modules are seeded in the correct order.
 */

export enum SeedModule {
  RBAC = "RBAC",
  FOUNDATION = "FOUNDATION",
  BUSINESS_PROCESSES = "BUSINESS_PROCESSES",
  ASSETS = "ASSETS",
  WARRANTIES_MAINTENANCE = "WARRANTIES_MAINTENANCE",
  SERVICES = "SERVICES",
  CMDB = "CMDB",
  LAYER3_ITAM = "LAYER3_ITAM",
  ATTACHMENTS_GOVERNANCE = "ATTACHMENTS_GOVERNANCE",
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
    name: "Foundation Layer",
    description: "Vendors, locations, org units, persons, lifecycle models",
    estimatedTime: 3,
    dependencies: [SeedModule.RBAC],
    tables: [
      "PersonRoleAssignment",
      "Person",
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

  [SeedModule.ASSETS]: {
    key: SeedModule.ASSETS,
    name: "Assets",
    description: "Asset categories, models, 50+ assets with assignments",
    estimatedTime: 4,
    dependencies: [SeedModule.RBAC, SeedModule.FOUNDATION],
    tables: [
      "AssetAssignment",
      "StockMovement",
      "Asset",
      "AssetModel",
      "AssetCategory",
      "StockLocation",
    ],
  },

  [SeedModule.WARRANTIES_MAINTENANCE]: {
    key: SeedModule.WARRANTIES_MAINTENANCE,
    name: "Warranties & Maintenance",
    description: "Warranty records and preventive maintenance schedules",
    estimatedTime: 2,
    dependencies: [SeedModule.ASSETS],
    tables: ["MaintenanceRecord", "MaintenanceSchedule", "Warranty"],
  },

  [SeedModule.SERVICES]: {
    key: SeedModule.SERVICES,
    name: "Services",
    description: "80 services with ownership and infrastructure tracking",
    estimatedTime: 3,
    dependencies: [
      SeedModule.RBAC,
      SeedModule.FOUNDATION,
      SeedModule.BUSINESS_PROCESSES,
    ],
    tables: [
      "ServiceAsset",
      "ServiceInfrastructure",
      "ServiceOwnership",
      "Service",
    ],
  },

  [SeedModule.CMDB]: {
    key: SeedModule.CMDB,
    name: "CMDB",
    description: "Configuration items, CI classes, relationships",
    estimatedTime: 2,
    dependencies: [SeedModule.RBAC, SeedModule.FOUNDATION],
    tables: [
      "CIRelationship",
      "ConfigurationItem",
      "RelationshipType",
      "CIClassField",
      "CIClass",
      "RelationshipTypeScope",
    ],
  },

  [SeedModule.LAYER3_ITAM]: {
    key: SeedModule.LAYER3_ITAM,
    name: "Advanced ITAM",
    description: "Asset disposals, kits, reservations, licenses, contracts",
    estimatedTime: 2,
    dependencies: [SeedModule.ASSETS, SeedModule.CMDB],
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

  [SeedModule.AI_PROMPTS_TASKS]: {
    key: SeedModule.AI_PROMPTS_TASKS,
    name: "AI Prompts & Tasks",
    description: "Example prompts and tasks for testing",
    estimatedTime: 1,
    dependencies: [SeedModule.RBAC, SeedModule.FOUNDATION],
    tables: ["Task", "AIPrompt"],
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
    !selected.has(SeedModule.ASSETS)
  ) {
    warnings.push(
      "Layer 3 ITAM features require Assets to be seeded for full functionality",
    );
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
      "Production-ready config only (no demo data). Run Graph sync after for persons.",
    modules: [
      SeedModule.RBAC,
      SeedModule.FOUNDATION,
      SeedModule.BUSINESS_PROCESSES,
      SeedModule.CMDB,
      SeedModule.ATTACHMENTS_GOVERNANCE,
    ],
  },
  {
    name: "full",
    description: "Complete database seed with demo data (all modules)",
    modules: Object.values(SeedModule),
  },
  {
    name: "dev",
    description:
      "Development with demo data (requires seeded persons for demo assets)",
    modules: [
      SeedModule.RBAC,
      SeedModule.FOUNDATION,
      SeedModule.BUSINESS_PROCESSES,
      SeedModule.ASSETS,
      SeedModule.WARRANTIES_MAINTENANCE,
      SeedModule.CMDB,
      SeedModule.LAYER3_ITAM,
      SeedModule.ATTACHMENTS_GOVERNANCE,
      SeedModule.AI_PROMPTS_TASKS,
    ],
  },
  {
    name: "minimal",
    description: "Minimal setup (RBAC + Foundation only)",
    modules: [SeedModule.RBAC, SeedModule.FOUNDATION],
  },
  {
    name: "rbac-only",
    description: "RBAC system only (permissions + roles)",
    modules: [SeedModule.RBAC],
  },
  {
    name: "services-only",
    description:
      "Services module only (run after Graph sync when persons exist)",
    modules: [SeedModule.SERVICES],
  },
  {
    name: "itam-complete",
    description:
      "Full ITAM stack with demo data (Assets + Warranties + Layer 3)",
    modules: [
      SeedModule.RBAC,
      SeedModule.FOUNDATION,
      SeedModule.ASSETS,
      SeedModule.WARRANTIES_MAINTENANCE,
      SeedModule.CMDB,
      SeedModule.LAYER3_ITAM,
    ],
  },
  {
    name: "services-complete",
    description: "Service management with dependencies (requires persons)",
    modules: [
      SeedModule.RBAC,
      SeedModule.FOUNDATION,
      SeedModule.BUSINESS_PROCESSES,
      SeedModule.SERVICES,
    ],
  },
];
