/**
 * Database Seed File
 *
 * Seeds the database with comprehensive test data:
 * 1. RBAC (roles, permissions, role-permission assignments)
 * 2. Foundation (lifecycle, vendors, org units, locations, persons, fields)
 * 3. Assets (categories, models, assets, stock, assignments)
 * 4. Warranties & Maintenance (warranties, schedules, records)
 * 5. CMDB (relationship types, configuration items, relationships)
 * 6. Layer 3 ITAM (disposals, asset kits, reservations)
 * 7. Attachment Types (polymorphic file attachments)
 * 8. Governance (data domains, ownerships, verification campaigns)
 * 9. AI prompt templates
 * 10. Example tasks (for demonstration)
 */

import { prisma } from "./client.js";
import { seedPrompts } from "./seed-prompts.js";
import { seedRBAC } from "./seed-rbac.js";
import { seedFoundation } from "./seed-foundation.js";
import { seedAssets } from "./seed-assets.js";
import { seedWarrantiesMaintenance } from "./seed-warranties-maintenance.js";
import { seedCMDB } from "./seed-cmdb.js";
import { seedLayer3ITAM } from "./seed-layer3-itam.js";
import { seedAttachments } from "./seed-attachments.js";
import { seedGovernance } from "./seed-governance.js";
import { seedBusinessProcesses, seedServices } from "./seed-services.js";
import { logSection, logSuccess, logStep } from "./seed-utils.js";
import {
  performFullCleanup,
  initializeCodeSequences,
  seedExampleTasks,
} from "./seed-operations.js";

async function main() {
  const startTime = Date.now();

  console.log("\n" + "=".repeat(60));
  console.log("🌱 COMPREHENSIVE DATABASE SEED");
  console.log("=".repeat(60));
  console.log("Starting comprehensive multi-layer seeding process...\n");

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

    // 1. Seed RBAC (roles, permissions, assignments)
    await seedRBAC();
    console.log("");

    // 2. Seed Foundation (lifecycle, vendors, org units, locations, persons, fields)
    await seedFoundation(prisma);
    console.log("");

    // 3. Seed Business Processes (for Service Management)
    await seedBusinessProcesses(prisma);

    // 4. Seed Assets (categories, models, assets, stock locations, movements, assignments)
    await seedAssets(prisma);
    console.log("");

    // 5. Seed Warranties & Maintenance (warranties, schedules, records)
    await seedWarrantiesMaintenance(prisma);
    console.log("");

    // 6. Seed Services (80 services with owners and infrastructure)
    await seedServices(prisma);
    console.log("");

    // 7. Seed CMDB Relationship Types (for Layer 3 to reference)
    await seedCMDB(prisma);
    console.log("");

    // 8. Seed Layer 3 ITAM (disposals, asset kits, reservations, complete CMDB with CIs and relationships)
    await seedLayer3ITAM(prisma);
    console.log("");

    // 7. Seed Attachment Types
    await seedAttachments(prisma);
    console.log("");

    // 8. Seed Governance (data domains, ownerships, verification campaigns)
    await seedGovernance(prisma);
    console.log("");

    // 9. Seed AI prompt templates
    logSection("AI Prompt Templates");
    logStep("🤖", "Seeding AI prompt templates...");
    await seedPrompts(prisma);
    logSuccess("AI prompt templates seeded");
    console.log("");

    // 10. Seed example tasks
    logSection("Example Tasks");
    logStep("📝", "Creating example tasks...");
    const taskCount = await seedExampleTasks(prisma);
    logSuccess(`Created ${taskCount} example tasks`);

    // Calculate execution time
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ COMPREHENSIVE DATABASE SEED COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\nSeeded data summary:");
    console.log("  Layer 0: RBAC System");
    console.log("    ✓ Roles, permissions, and role-permission assignments");
    console.log("  Layer 1: Foundation");
    console.log(
      "    ✓ Lifecycle, vendors, org units, locations, persons, fields",
    );
    console.log("  Service Management:");
    console.log(
      "    ✓ 25 business processes (Core Banking, Channels, Infrastructure, etc.)",
    );
    console.log("    ✓ 80 services with owners and infrastructure details");
    console.log("  Layer 2: Asset Management");
    console.log("    ✓ Categories, models, 50+ assets, stock, assignments");
    console.log(
      "    ✓ Warranties, maintenance schedules, and maintenance records",
    );
    console.log("  Layer 3: Advanced ITAM");
    console.log("    ✓ Asset Disposals (approval workflow)");
    console.log("    ✓ Asset Kits (predefined bundles with checkout tracking)");
    console.log(
      "    ✓ Asset Reservations (future booking with conflict detection)",
    );
    console.log(
      "    ✓ CMDB (configuration items, relationships, dependency tracking)",
    );
    console.log("    ✓ Attachment Types (polymorphic file attachments)");
    console.log(
      "    ✓ Governance (data domains, ownerships, verification campaigns)",
    );
    console.log("  Support Systems:");
    console.log("    ✓ AI prompt templates");
    console.log("    ✓ Example tasks");
    console.log("\n" + "─".repeat(60));
    console.log(`⏱️  Total execution time: ${duration}s`);
    console.log("─".repeat(60));
    console.log(
      "\nYour ITAM system is now ready with comprehensive test data!",
    );
    console.log("Run: npm run dev\n");
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
