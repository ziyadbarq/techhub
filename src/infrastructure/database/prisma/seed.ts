/**
 * Database Seed File
 *
 * Seeds the database based on selected preset:
 * - production: RBAC, Foundation, Business Processes, CMDB types, Governance (no demo data)
 * - dev: Production + demo assets, warranties, Layer 3 ITAM, AI tasks
 * - full: All modules including services (requires persons)
 *
 * Usage:
 *   npm run db:seed           # production preset (default)
 *   npm run db:seed:dev       # dev preset with demo data
 *   npm run db:seed:full      # full preset with all modules
 *   npm run db:seed -- <preset>  # any preset by name
 */

import { prisma } from "./client.js";
import { seedPrompts } from "./seed-prompts.js";
import { seedRBAC } from "./seed-rbac.js";
import { seedFeatureFlags } from "./seed-features.js";
import { seedFoundation } from "./seed-foundation.js";
import { seedAssets } from "./seed-assets.js";
import { seedWarrantiesMaintenance } from "./seed-warranties-maintenance.js";
import { seedCMDB } from "./seed-cmdb.js";
import { seedLayer3ITAM } from "./seed-layer3-itam.js";
import { seedAttachments } from "./seed-attachments.js";
import { seedGovernance } from "./seed-governance.js";
import { seedBusinessProcesses, seedServices } from "./seed-services.js";
import { logSection, logSuccess, logStep, logWarning } from "./seed-utils.js";
import {
  performFullCleanup,
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
    // 0. Cleanup all tables
    logStep("🧹", "Cleaning up database...");
    await performFullCleanup(prisma);
    logSuccess("Database cleaned");
    console.log("");

    // 0.5. Initialize Code Sequence table
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

    // 2. Seed Foundation
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

    // 4. Seed Assets (demo data)
    if (shouldSeed(SeedModule.ASSETS)) {
      await seedAssets(prisma);
      seeded.push("Assets (categories, models, demo assets, stock)");
      console.log("");
    }

    // 5. Seed Warranties & Maintenance (demo data)
    if (shouldSeed(SeedModule.WARRANTIES_MAINTENANCE)) {
      await seedWarrantiesMaintenance(prisma);
      seeded.push("Warranties & Maintenance (demo data)");
      console.log("");
    }

    // 6. Seed Services (requires persons)
    if (shouldSeed(SeedModule.SERVICES)) {
      // Check if persons exist first
      const personCount = await prisma.person.count();
      if (personCount === 0) {
        logWarning(
          "Services module skipped - no persons exist. Run Graph sync first, then use services-only preset.",
        );
      } else {
        await seedServices(prisma);
        seeded.push("Services (80 services with owners)");
      }
      console.log("");
    }

    // 7. Seed CMDB (relationship types + optional demo CIs)
    if (shouldSeed(SeedModule.CMDB)) {
      await seedCMDB(prisma);
      seeded.push("CMDB (CI classes, relationship types)");
      console.log("");
    }

    // 8. Seed Layer 3 ITAM (demo data)
    if (shouldSeed(SeedModule.LAYER3_ITAM)) {
      await seedLayer3ITAM(prisma);
      seeded.push("Layer 3 ITAM (disposals, kits, reservations, licenses)");
      console.log("");
    }

    // 9. Seed Attachment Types
    if (shouldSeed(SeedModule.ATTACHMENTS_GOVERNANCE)) {
      await seedAttachments(prisma);
      seeded.push("Attachment types");
      console.log("");

      await seedGovernance(prisma);
      seeded.push("Governance (data domains, ownerships, verification)");
      console.log("");
    }

    // 10. Seed AI Prompts & Tasks (demo/dev data)
    if (shouldSeed(SeedModule.AI_PROMPTS_TASKS)) {
      logSection("AI Prompt Templates");
      logStep("🤖", "Seeding AI prompt templates...");
      await seedPrompts(prisma);
      logSuccess("AI prompt templates seeded");
      seeded.push("AI prompt templates");
      console.log("");

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
      console.log("  2. Create first admin via /register");
      console.log("  3. Assign system-administrator role via Prisma Studio");
      console.log(
        "  4. (Optional) Run db:seed -- services-only to seed services",
      );
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
