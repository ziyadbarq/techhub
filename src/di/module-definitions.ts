/**
 * DI Module Definitions
 *
 * Defines all DI modules and their metadata (tier, dependencies, feature flags, health checks).
 * This is the central registry of all application modules.
 *
 * Module Tiers:
 * - CORE: Always loaded (RBAC, Foundation, base infrastructure)
 * - DASHBOARD: Loaded for dashboard users (Assets, Inventory, CMDB)
 * - HEAVY: Lazy loaded on demand (Intune, Services, Licenses)
 */

import type { Container } from "inversify";
import { ModuleTier, type DIModule } from "./module-registry";

// Import module binding functions
import { bindLoggerDependencies } from "./modules/logger.module";
import { bindFileStorageDependencies } from "./modules/file-storage.module";
import { bindCodeGeneratorDependencies } from "./modules/code-generator.module";
import { bindDatabaseDependencies } from "./modules/database.module";
import { bindRBACDependencies } from "./modules/rbac.module";
import { bindUserProvisioningDependencies } from "./modules/user-provisioning.module";
import { bindSystemSetupDependencies } from "./modules/system-setup.module";
import { bindDatabaseBackupDependencies } from "./modules/database-backup.module";
import { bindFeatureFlagsDependencies } from "./modules/feature-flags.module";
import { bindFoundationDependencies } from "./modules/foundation.module";
import { bindMicrosoftGraphDependencies } from "./modules/ms-graph.module";
import { bindAssetDependencies } from "./modules/asset.module";
import { bindInventoryDependencies } from "./modules/inventory.module";
import { bindCMDBDependencies } from "./modules/cmdb.module";
import { bindContractsDependencies } from "./modules/contracts.module";
import { bindLicensesDependencies } from "./modules/licenses.module";
import { bindGovernanceDependencies } from "./modules/governance.module";
import { bindAttachmentsDependencies } from "./modules/attachments.module";
import { bindServiceDependencies } from "./modules/service.module";
import { bindIntuneDependencies } from "./modules/intune.module";
import { loadDisposalModule } from "./modules/disposal.module";
import { loadAssetKitsModule } from "./modules/asset-kits.module";
import { loadReservationsModule } from "./modules/reservations.module";
import { bindSearchDependencies } from "./modules/search.module";
import { bindUseCaseDependencies } from "./modules/use-cases.module";
import { bindCSVServiceDependencies } from "./modules/csv.module";
import { bindRealtimeDependencies } from "./modules/realtime.module";
import { bindQueueDependencies } from "./modules/queue.module";
import { bindEmailDependencies } from "./modules/email.module";

// Import health check utilities
import { createMicrosoftGraphHealthCheck } from "./health-checks/microsoft-graph.health";
import { createIntuneHealthCheck } from "./health-checks/intune.health";

/**
 * CORE TIER MODULES
 * Always loaded - required for application to function
 */

export const LOGGER_MODULE: DIModule = {
  name: "logger",
  displayName: "Logger Service",
  tier: ModuleTier.CORE,
  description: "Structured logging with Pino",
  dependencies: [],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindLoggerDependencies(container);
  },
};

export const FILE_STORAGE_MODULE: DIModule = {
  name: "file-storage",
  displayName: "File Storage",
  tier: ModuleTier.CORE,
  description: "Local file storage service",
  dependencies: ["logger"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindFileStorageDependencies(container);
  },
};

export const CODE_GENERATOR_MODULE: DIModule = {
  name: "code-generator",
  displayName: "Code Generator",
  tier: ModuleTier.CORE,
  description: "QR code and barcode generation",
  dependencies: ["logger"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindCodeGeneratorDependencies(container);
  },
};

export const DATABASE_MODULE: DIModule = {
  name: "database",
  displayName: "Database",
  tier: ModuleTier.CORE,
  description: "Prisma database client and base repositories",
  dependencies: ["logger"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindDatabaseDependencies(container);
  },
};

export const RBAC_MODULE: DIModule = {
  name: "rbac",
  displayName: "RBAC",
  tier: ModuleTier.CORE,
  description: "Role-based access control",
  dependencies: ["logger", "database"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindRBACDependencies(container);
  },
};

export const USER_PROVISIONING_MODULE: DIModule = {
  name: "user-provisioning",
  displayName: "User Provisioning",
  tier: ModuleTier.CORE,
  description: "User account creation and password reset",
  dependencies: ["logger", "database", "rbac"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindUserProvisioningDependencies(container);
  },
};

export const SYSTEM_SETUP_MODULE: DIModule = {
  name: "system-setup",
  displayName: "System Setup",
  tier: ModuleTier.CORE,
  description: "System health checks and setup utilities",
  dependencies: ["logger", "database"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindSystemSetupDependencies(container);
  },
};

export const DATABASE_BACKUP_MODULE: DIModule = {
  name: "database-backup",
  displayName: "Database Backup",
  tier: ModuleTier.CORE,
  description: "Database backup and restore utilities",
  dependencies: ["logger", "database"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindDatabaseBackupDependencies(container);
  },
};

export const FEATURE_FLAGS_MODULE: DIModule = {
  name: "feature-flags",
  displayName: "Feature Flags",
  tier: ModuleTier.CORE,
  description: "Feature flag management and enforcement",
  dependencies: ["logger", "database"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindFeatureFlagsDependencies(container);
  },
};

export const FOUNDATION_MODULE: DIModule = {
  name: "foundation",
  displayName: "Foundation Entities",
  tier: ModuleTier.CORE,
  description: "Core entities (Person, Location, Vendor, Lifecycle, etc.)",
  dependencies: ["logger", "database"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindFoundationDependencies(container);
  },
};

export const EMAIL_MODULE: DIModule = {
  name: "email",
  displayName: "Email Service",
  tier: ModuleTier.CORE,
  description: "Email sending via Resend",
  dependencies: ["logger"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindEmailDependencies(container);
  },
};

export const REALTIME_MODULE: DIModule = {
  name: "realtime",
  displayName: "Real-time Services",
  tier: ModuleTier.CORE,
  description: "SSE and Partykit real-time features",
  dependencies: ["logger"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindRealtimeDependencies(container);
  },
};

export const QUEUE_MODULE: DIModule = {
  name: "queue",
  displayName: "Job Queue",
  tier: ModuleTier.CORE,
  description: "BullMQ background job processing",
  dependencies: ["logger"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindQueueDependencies(container);
  },
};

export const CSV_MODULE: DIModule = {
  name: "csv",
  displayName: "CSV Service",
  tier: ModuleTier.CORE,
  description: "CSV parsing and generation",
  dependencies: ["logger"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindCSVServiceDependencies(container);
  },
};

/**
 * DASHBOARD TIER MODULES
 * Loaded for dashboard users - common ITAM features
 */

export const ASSET_MODULE: DIModule = {
  name: "asset",
  displayName: "Asset Management",
  tier: ModuleTier.DASHBOARD,
  description: "Asset lifecycle, categories, models, assignments",
  dependencies: ["logger", "database", "foundation"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindAssetDependencies(container);
  },
};

export const INVENTORY_MODULE: DIModule = {
  name: "inventory",
  displayName: "Inventory Management",
  tier: ModuleTier.DASHBOARD,
  description: "Stock locations, movements, reservations",
  dependencies: ["logger", "database", "foundation", "asset"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindInventoryDependencies(container);
  },
};

export const CMDB_MODULE: DIModule = {
  name: "cmdb",
  displayName: "CMDB",
  tier: ModuleTier.DASHBOARD,
  description: "Configuration items and relationships",
  dependencies: ["logger", "database", "foundation"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindCMDBDependencies(container);
  },
};

export const CONTRACTS_MODULE: DIModule = {
  name: "contracts",
  displayName: "Contract Management",
  tier: ModuleTier.DASHBOARD,
  description: "Contract types, contracts, linked objects",
  featureFlag: "CONTRACTS",
  dependencies: ["logger", "database", "foundation"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindContractsDependencies(container);
  },
};

export const GOVERNANCE_MODULE: DIModule = {
  name: "governance",
  displayName: "Data Governance",
  tier: ModuleTier.DASHBOARD,
  description: "Data domains, ownership, verification campaigns",
  featureFlag: "GOVERNANCE",
  dependencies: ["logger", "database", "foundation"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindGovernanceDependencies(container);
  },
};

export const ATTACHMENTS_MODULE: DIModule = {
  name: "attachments",
  displayName: "Attachments",
  tier: ModuleTier.DASHBOARD,
  description: "File attachments for entities",
  featureFlag: "ATTACHMENTS",
  dependencies: ["logger", "database", "file-storage"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindAttachmentsDependencies(container);
  },
};

export const DISPOSAL_MODULE: DIModule = {
  name: "disposal",
  displayName: "Asset Disposal",
  tier: ModuleTier.DASHBOARD,
  description: "Asset disposal workflow with approvals",
  featureFlag: "DISPOSALS",
  dependencies: ["logger", "database", "foundation", "asset"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    loadDisposalModule(container);
  },
};

export const ASSET_KITS_MODULE: DIModule = {
  name: "asset-kits",
  displayName: "Asset Kits",
  tier: ModuleTier.DASHBOARD,
  description: "Asset kit management and checkout",
  featureFlag: "ASSET_KITS",
  dependencies: ["logger", "database", "foundation", "asset"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    loadAssetKitsModule(container);
  },
};

export const RESERVATIONS_MODULE: DIModule = {
  name: "reservations",
  displayName: "Asset Reservations",
  tier: ModuleTier.DASHBOARD,
  description: "Asset reservation and conflict detection",
  featureFlag: "RESERVATIONS",
  dependencies: ["logger", "database", "foundation", "asset"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    loadReservationsModule(container);
  },
};

export const SEARCH_MODULE: DIModule = {
  name: "search",
  displayName: "Global Search",
  tier: ModuleTier.DASHBOARD,
  description: "Search across all entities",
  dependencies: ["logger", "database", "asset", "foundation"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindSearchDependencies(container);
  },
};

/**
 * HEAVY TIER MODULES
 * Lazy loaded on demand - external APIs and heavy dependencies
 */

export const MICROSOFT_GRAPH_MODULE: DIModule = {
  name: "microsoft-graph",
  displayName: "Microsoft Graph",
  tier: ModuleTier.HEAVY,
  description: "Azure AD user sync via Microsoft Graph API",
  dependencies: ["logger"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindMicrosoftGraphDependencies(container);
  },
  healthCheck: createMicrosoftGraphHealthCheck(),
};

export const INTUNE_MODULE: DIModule = {
  name: "intune",
  displayName: "Intune Integration",
  tier: ModuleTier.HEAVY,
  description: "Microsoft Intune device management and compliance",
  featureFlag: "INTUNE",
  dependencies: [
    "logger",
    "database",
    "foundation",
    "asset",
    "microsoft-graph",
  ],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindIntuneDependencies(container);
  },
  healthCheck: createIntuneHealthCheck(),
};

export const SERVICE_MODULE: DIModule = {
  name: "service",
  displayName: "Service Management",
  tier: ModuleTier.HEAVY,
  description:
    "IT service catalog, ownership, business alignment, SLA tracking",
  featureFlag: "SERVICES",
  dependencies: ["logger", "database", "foundation", "cmdb", "asset"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindServiceDependencies(container);
  },
};

export const LICENSES_MODULE: DIModule = {
  name: "licenses",
  displayName: "License Management",
  tier: ModuleTier.HEAVY,
  description:
    "Software license products, entitlements, allocations, cost tracking",
  featureFlag: "LICENSES",
  dependencies: ["logger", "database", "foundation"],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindLicensesDependencies(container);
  },
};

/**
 * USE CASES MODULE
 * Cross-cutting use cases that depend on multiple modules
 * Loaded after all other modules
 */
export const USE_CASES_MODULE: DIModule = {
  name: "use-cases",
  displayName: "Use Cases",
  tier: ModuleTier.DASHBOARD,
  description: "Cross-cutting business logic",
  dependencies: [
    "logger",
    "database",
    "rbac",
    "foundation",
    "asset",
    "inventory",
    "cmdb",
  ],
  isLoaded: false,
  bindFunction: (container: Container) => {
    bindUseCaseDependencies(container);
  },
};

/**
 * ALL MODULES
 * Complete list of all modules in load order
 */
export const ALL_MODULES: DIModule[] = [
  // CORE tier (always loaded)
  LOGGER_MODULE,
  FILE_STORAGE_MODULE,
  CODE_GENERATOR_MODULE,
  DATABASE_MODULE,
  RBAC_MODULE,
  USER_PROVISIONING_MODULE,
  SYSTEM_SETUP_MODULE,
  DATABASE_BACKUP_MODULE,
  FEATURE_FLAGS_MODULE,
  FOUNDATION_MODULE,
  EMAIL_MODULE,
  REALTIME_MODULE,
  QUEUE_MODULE,
  CSV_MODULE,

  // DASHBOARD tier (loaded for dashboard users)
  ASSET_MODULE,
  INVENTORY_MODULE,
  CMDB_MODULE,
  CONTRACTS_MODULE,
  GOVERNANCE_MODULE,
  ATTACHMENTS_MODULE,
  DISPOSAL_MODULE,
  ASSET_KITS_MODULE,
  RESERVATIONS_MODULE,
  SEARCH_MODULE,
  USE_CASES_MODULE,

  // HEAVY tier (lazy loaded)
  MICROSOFT_GRAPH_MODULE,
  INTUNE_MODULE,
  SERVICE_MODULE,
  LICENSES_MODULE,
];

/**
 * Get modules by tier
 */
export function getModulesByTier(tier: ModuleTier): DIModule[] {
  return ALL_MODULES.filter((m) => m.tier === tier);
}

/**
 * Get module by name
 */
export function getModuleByName(name: string): DIModule | undefined {
  return ALL_MODULES.find((m) => m.name === name);
}
