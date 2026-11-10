/**
 * Feature Flag Seed Data
 * Seeds all feature flag definitions with dependencies
 *
 * Default: All features DISABLED (system admin must enable manually)
 */

import type { PrismaClient } from "@/generated/prisma/server";
import type { FeatureFlagCategory } from "@/generated/prisma";
import { prisma as prismaSingleton } from "./client";
import { logSection, logStep, logSuccess } from "./seed-utils";

/**
 * Feature flag definition
 */
interface FeatureFlagDefinition {
  name: string;
  displayName: string;
  description: string;
  category: FeatureFlagCategory;
  isSystem: boolean;
  dependsOn: string[];
  defaultEnabled?: boolean; // If true, enabled by default on first seed
}

/**
 * All feature flag definitions
 * Organized by layer/category
 */
export const FEATURE_FLAGS: FeatureFlagDefinition[] = [
  // ============================================
  // SYSTEM (Special Flags)
  // ============================================
  {
    name: "MAINTENANCE_MODE",
    displayName: "Maintenance Mode",
    description:
      "Global maintenance mode - disables all features for all users. Use this during system upgrades or critical maintenance windows.",
    category: "SYSTEM",
    isSystem: true,
    dependsOn: [],
  },

  // ============================================
  // LAYER 1 (Foundation)
  // ============================================
  {
    name: "FOUNDATION",
    displayName: "Foundation Layer",
    description:
      "Core entities: Organization Units, Persons, Locations, Vendors, Lifecycles, Field Definitions. Required by most other features.",
    category: "LAYER_1",
    isSystem: false,
    dependsOn: [],
    defaultEnabled: true,
  },
  {
    name: "RBAC",
    displayName: "Role-Based Access Control",
    description:
      "Role and permission management system. Controls user access to features and data.",
    category: "LAYER_1",
    isSystem: false,
    dependsOn: [],
    defaultEnabled: true,
  },
  {
    name: "FX_RATES",
    displayName: "Exchange Rates",
    description:
      "Multi-currency support with SAR base currency. Enables exchange rate management and currency conversion.",
    category: "LAYER_1",
    isSystem: false,
    dependsOn: [],
  },
  {
    name: "DATA_IMPORT",
    displayName: "Universal Data Importer",
    description:
      "CSV/Excel import wizard for bulk data uploads. Supports all entity types with validation and error reporting.",
    category: "LAYER_1",
    isSystem: false,
    dependsOn: ["FOUNDATION"],
    defaultEnabled: true,
  },

  // ============================================
  // LAYER 2 (Asset Management)
  // ============================================
  {
    name: "ASSETS",
    displayName: "Asset Management",
    description:
      "Core asset tracking: Assets, Categories, Models, Assignments. Foundation for inventory and lifecycle management.",
    category: "LAYER_2",
    isSystem: false,
    dependsOn: ["FOUNDATION"],
    defaultEnabled: true,
  },
  {
    name: "MAINTENANCE",
    displayName: "Maintenance Management",
    description:
      "Preventive maintenance schedules and maintenance records. Track maintenance history and upcoming service.",
    category: "LAYER_2",
    isSystem: false,
    dependsOn: ["ASSETS"],
  },
  {
    name: "INVENTORY",
    displayName: "Inventory Management",
    description:
      "Stock locations and stock movements. Track asset storage and transfers between locations.",
    category: "LAYER_2",
    isSystem: false,
    dependsOn: ["ASSETS"],
    defaultEnabled: true,
  },
  {
    name: "WARRANTIES",
    displayName: "Warranty Tracking",
    description:
      "Warranty management for assets. Track coverage periods, terms, and expiration dates.",
    category: "LAYER_2",
    isSystem: false,
    dependsOn: ["ASSETS"],
  },

  // ============================================
  // LAYER 3 (Advanced ITAM)
  // ============================================
  {
    name: "CMDB",
    displayName: "Configuration Management Database",
    description:
      "Configuration Items with dependency tracking. Manage CI relationships, classes, and change tracking.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["FOUNDATION"],
    defaultEnabled: true,
  },
  {
    name: "CONTRACTS",
    displayName: "Contract Management",
    description:
      "Contract lifecycle management. Track vendor contracts, renewals, and linked assets/services.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["FOUNDATION"],
  },
  {
    name: "LICENSES",
    displayName: "License Management",
    description:
      "Software license tracking. Manage entitlements, allocations, and compliance for licensed products.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["FOUNDATION"],
  },
  {
    name: "SERVICES",
    displayName: "Service Management",
    description:
      "IT service catalog with ownership and business alignment. Track services, business processes, and infrastructure.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["CMDB", "FOUNDATION"],
    defaultEnabled: true,
  },
  {
    name: "SERVICE_HEALTH_SLA",
    displayName: "Service Health & SLA Monitoring",
    description:
      "Real-time health monitoring and SLA compliance tracking for services. Includes performance metrics, uptime tracking, SLA targets, and automated health checks.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["SERVICES"],
  },
  {
    name: "GOVERNANCE",
    displayName: "Data Governance",
    description:
      "Data domains, ownership tracking, and verification campaigns. SAMA compliance and audit support.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["FOUNDATION"],
  },
  {
    name: "ATTACHMENTS",
    displayName: "File Attachments",
    description:
      "Polymorphic file attachments for compliance documentation, invoices, and audit trails.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: [],
  },
  {
    name: "ASSET_DISPOSALS",
    displayName: "Asset Disposals",
    description:
      "Multi-step disposal workflow with approval chain and certificate generation. Track retired asset disposition.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["ASSETS"],
  },
  {
    name: "ASSET_KITS",
    displayName: "Asset Kits",
    description:
      "Predefined asset bundles (e.g., new hire kits). Checkout tracking with partial return support.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["ASSETS"],
  },
  {
    name: "ASSET_RESERVATIONS",
    displayName: "Asset Reservations",
    description:
      "Future date reservations with conflict detection. Calendar view and availability checking.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["ASSETS"],
  },
  {
    name: "INTUNE",
    displayName: "Intune/MDM Integration",
    description:
      "Microsoft Intune device sync and compliance tracking. Links MDM devices to ITAM assets and persons for reconciliation and SAMA compliance reporting.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["FOUNDATION", "ASSETS"],
    defaultEnabled: true,
  },
  {
    name: "OCI_SYNC",
    displayName: "OCI Cloud Sync",
    description:
      "Oracle Cloud Infrastructure resource sync via n8n webhook. Automatically imports compute, load balancers, OKE clusters, databases, and object storage as CMDB Configuration Items.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["FOUNDATION", "CMDB"],
  },
  {
    name: "REPORTS",
    displayName: "Reports & Analytics",
    description:
      "Advanced reporting with PDF export, scheduled email delivery, and cross-module analytics for Assets and CMDB.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["FOUNDATION"],
  },
  {
    name: "KNOWLEDGE_BASE",
    displayName: "Knowledge Base",
    description:
      "Managed internal knowledge articles and policies: PDF or structured editor, controlled publishing, version history, restricted policies, and acknowledgements.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["RBAC"],
    // Disabled by default; an administrator must enable it explicitly.
  },
  {
    name: "WORKFLOW_ENGINE",
    displayName: "Workflow Engine",
    description:
      "Generic configurable workflow engine for request-based processes (Change Management, Access Requests, Vendor Onboarding, etc.). Powers /workflows routes, the engine DI bindings, and the SLA/automation cron jobs. Forms and workflow definitions are loaded as seed data on top of the engine.",
    category: "LAYER_3",
    isSystem: false,
    dependsOn: ["RBAC", "FOUNDATION"],
  },
];

/**
 * Main seed function
 */
export async function seedFeatureFlags(prismaClient?: PrismaClient) {
  const prisma = prismaClient ?? prismaSingleton;
  logSection("Feature Flags");

  try {
    logStep("🚩", "Creating feature flags...");

    // Upsert all feature flags
    let enabledCount = 0;
    for (const flag of FEATURE_FLAGS) {
      await prisma.featureFlag.upsert({
        where: { name: flag.name },
        update: {
          displayName: flag.displayName,
          description: flag.description,
          category: flag.category,
          isSystem: flag.isSystem,
          dependsOn: flag.dependsOn,
          // Note: isEnabled is NOT updated on re-seed (preserve admin choices)
        },
        create: {
          name: flag.name,
          displayName: flag.displayName,
          description: flag.description,
          category: flag.category,
          isEnabled: flag.defaultEnabled ?? false,
          isSystem: flag.isSystem,
          dependsOn: flag.dependsOn,
        },
      });
      if (flag.defaultEnabled) enabledCount++;
    }

    logSuccess(
      `Created ${FEATURE_FLAGS.length} feature flags (${enabledCount} enabled by default)`,
    );

    // Show summary by category
    const byCategory = FEATURE_FLAGS.reduce(
      (acc, flag) => {
        acc[flag.category] = (acc[flag.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("    📊 By Category:");
    for (const [category, count] of Object.entries(byCategory)) {
      console.log(`       ${category}: ${count}`);
    }
  } catch (error) {
    console.error("❌ Error seeding feature flags:", error);
    throw error;
  }
}

/**
 * Standalone execution (ESM)
 */
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  seedFeatureFlags()
    .then(() => {
      console.log("✅ Feature flags seeded successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error seeding feature flags:", error);
      process.exit(1);
    });
}
