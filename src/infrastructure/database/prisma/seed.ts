/**
 * Database Seed File (Idempotent / Append-Only)
 *
 * Seeds the database based on selected preset:
 * - production: Config/reference data only (no demo data)
 * - dev: Full development environment with all demo data
 *
 * IMPORTANT: This seeder is fully IDEMPOTENT:
 * - Never wipes existing data
 * - Never creates duplicates (uses upsert/check-before-create)
 * - Safe to run multiple times
 * - Amends missing data without affecting existing records
 *
 * Usage:
 *   npm run db:seed              # production preset (default)
 *   npm run db:seed -- dev       # dev preset with demo data
 *   npm run db:seed -- <preset>  # any preset by name
 */

import { prisma } from "./client.js";
import { seedRBAC } from "./seed-rbac.js";
import { seedFeatureFlags } from "./seed-features.js";
import { seedFoundation, seedDemoPersons } from "./seed-foundation.js";
import { seedAssetConfig, seedDemoAssets } from "./seed-assets.js";
import { seedWarrantiesMaintenance } from "./seed-warranties-maintenance.js";
import { seedCMDB } from "./seed-cmdb.js";
import { seedLayer3ITAM } from "./seed-layer3-itam.js";
import { seedAttachments } from "./seed-attachments.js";
import { seedGovernance } from "./seed-governance.js";
import { seedLicenses } from "./seed-licenses.js";
import {
  seedBusinessProcesses,
  seedServices,
  seedServiceOwners,
} from "./seed-services.js";
import { logSection, logSuccess, logStep } from "./seed-utils.js";
import {
  initializeCodeSequences,
  seedExampleTasks,
} from "./seed-operations.js";
import {
  BUILTIN_PRESETS,
  SeedModule,
  resolveDependencies,
} from "./seed-dependencies.js";

/**
 * Parse command line arguments for preset selection
 */
function getSelectedPreset(): { name: string; modules: Set<SeedModule> } {
  const presetName = process.argv[2] || "production";

  // Find the preset
  const preset = BUILTIN_PRESETS.find((p) => p.name === presetName);
  if (!preset) {
    const available = BUILTIN_PRESETS.map((p) => p.name).join(", ");
    console.error(`\n❌ Unknown preset: "${presetName}"`);
    console.error(`Available presets: ${available}\n`);
    process.exit(1);
  }

  // Resolve all dependencies
  const resolvedModules = resolveDependencies(preset.modules);
  return {
    name: preset.name,
    modules: new Set(resolvedModules),
  };
}

async function main() {
  const startTime = Date.now();
  const { name: presetName, modules } = getSelectedPreset();

  // Helper to check if a module should be seeded
  const shouldSeed = (module: SeedModule) => modules.has(module);

  console.log("\n" + "=".repeat(60));
  console.log(`🌱 DATABASE SEED - ${presetName.toUpperCase()} PRESET`);
  console.log("=".repeat(60));

  const preset = BUILTIN_PRESETS.find((p) => p.name === presetName);
  console.log(`📋 ${preset?.description || ""}`);
  console.log(`📦 Modules: ${Array.from(modules).join(", ")}\n`);

  try {
    // 0. Initialize Code Sequence table (idempotent)
    logSection("Code Sequence Initialization");
    logStep("🔢", "Initializing code sequences for auto-generation...");
    const sequenceCount = await initializeCodeSequences(prisma);
    logSuccess(`Initialized ${sequenceCount} code sequences`);
    console.log("");

    // Track what was seeded
    const seeded: string[] = [];

    // 1. Seed RBAC (always required - base dependency)
    if (shouldSeed(SeedModule.RBAC)) {
      await seedRBAC();
      seeded.push("RBAC (roles, permissions)");
      console.log("");

      // Feature flags go with RBAC
      await seedFeatureFlags(prisma);
      seeded.push("Feature flags");
      console.log("");
    }

    // ==============================================
    // Production Modules (config/reference data)
    // ==============================================

    // 2. Seed Foundation (config only, no demo persons)
    if (shouldSeed(SeedModule.FOUNDATION)) {
      await seedFoundation(prisma);
      seeded.push("Foundation (vendors, locations, org units, lifecycle)");
      console.log("");
    }

    // 3. Seed Business Processes
    if (shouldSeed(SeedModule.BUSINESS_PROCESSES)) {
      await seedBusinessProcesses(prisma);
      seeded.push("Business Processes (25 processes)");
      console.log("");
    }

    // 4. Seed Asset Config (categories, models, stock locations)
    if (shouldSeed(SeedModule.ASSET_CONFIG)) {
      await seedAssetConfig(prisma);
      seeded.push("Asset Config (categories, models, stock locations)");
      console.log("");
    }

    // 5. Seed CMDB Config (CI classes, relationship types)
    if (shouldSeed(SeedModule.CMDB)) {
      await seedCMDB(prisma);
      seeded.push("CMDB Config (CI classes, relationship types)");
      console.log("");
    }

    // 6. Seed Services (no owners)
    if (shouldSeed(SeedModule.SERVICES)) {
      await seedServices(prisma);
      seeded.push("Services (74 services with infrastructure)");
      console.log("");
    }

    // 7. Seed Attachment Types & Governance
    if (shouldSeed(SeedModule.ATTACHMENTS_GOVERNANCE)) {
      await seedAttachments(prisma);
      seeded.push("Attachment types");
      console.log("");

      await seedGovernance(prisma);
      seeded.push("Governance (data domains, ownerships, verification)");
      console.log("");
    }

    // 7.5. Seed License Products (Microsoft 365)
    if (shouldSeed(SeedModule.CMDB)) {
      // License products depend on vendors (foundation layer)
      await seedLicenses(prisma);
      seeded.push("License Products (Microsoft 365)");
      console.log("");
    }

    // ==============================================
    // Demo-only Modules
    // ==============================================

    // 8. Seed Demo Persons
    if (shouldSeed(SeedModule.DEMO_PERSONS)) {
      await seedDemoPersons(prisma);
      seeded.push("Demo Persons (21 demo persons)");
      console.log("");
    }

    // 9. Seed Demo Assets
    if (shouldSeed(SeedModule.DEMO_ASSETS)) {
      await seedDemoAssets(prisma);
      seeded.push("Demo Assets (50+ assets with assignments)");
      console.log("");
    }

    // 10. Seed Service Owners
    if (shouldSeed(SeedModule.SERVICE_OWNERS)) {
      await seedServiceOwners(prisma);
      seeded.push("Service Owners (ownership assignments)");
      console.log("");
    }

    // 11. Seed Warranties & Maintenance (demo data)
    if (shouldSeed(SeedModule.WARRANTIES_MAINTENANCE)) {
      await seedWarrantiesMaintenance(prisma);
      seeded.push("Warranties & Maintenance (demo data)");
      console.log("");
    }

    // 12. Seed Layer 3 ITAM (demo data)
    if (shouldSeed(SeedModule.LAYER3_ITAM)) {
      await seedLayer3ITAM(prisma);
      seeded.push("Layer 3 ITAM (disposals, kits, reservations, licenses)");
      console.log("");
    }

    // 13. Seed Example Tasks (demo/dev data)
    if (shouldSeed(SeedModule.AI_PROMPTS_TASKS)) {
      logSection("Example Tasks");
      logStep("📝", "Creating example tasks...");
      const taskCount = await seedExampleTasks(prisma);
      logSuccess(`Created ${taskCount} example tasks`);
      seeded.push("Example tasks");
    }

    // Calculate execution time
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log(
      `✅ DATABASE SEED COMPLETED - ${presetName.toUpperCase()} PRESET`,
    );
    console.log("=".repeat(60));
    console.log("\nSeeded modules:");
    for (const item of seeded) {
      console.log(`  ✓ ${item}`);
    }

    if (presetName === "production") {
      console.log("\n📝 Next steps for production:");
      console.log("  1. Run Microsoft Graph sync to populate persons");
      console.log("  2. Import services: npx tsx scripts/import-services.ts");
      console.log(
        "  3. Import service ownership: npx tsx scripts/import-service-ownership.ts",
      );
      console.log("  4. Create first admin via /register");
      console.log("  5. Assign system-administrator role via Prisma Studio");
    }

    console.log("\n" + "─".repeat(60));
    console.log(`⏱️  Total execution time: ${duration}s`);
    console.log("─".repeat(60));
    console.log("\nRun: npm run dev\n");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ SEED FAILED");
    console.error("=".repeat(60));
    console.error("\nError details:", error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
