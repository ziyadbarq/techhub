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
 * 7. AI prompt templates
 * 8. Example tasks (for demonstration)
 */

import { TaskStatus } from "../../../generated/prisma/client.js";
import { prisma } from "./client.js";
import { seedPrompts } from "./seed-prompts.js";
import { seedRBAC } from "./seed-rbac.js";
import { seedFoundation } from "./seed-foundation.js";
import { seedAssets } from "./seed-assets.js";
import { seedWarrantiesMaintenance } from "./seed-warranties-maintenance.js";
import { seedCMDB } from "./seed-cmdb.js";
import { seedLayer3ITAM } from "./seed-layer3-itam.js";
import { logSection, logSuccess, logStep } from "./seed-utils.js";

async function main() {
  const startTime = Date.now();

  console.log("\n" + "=".repeat(60));
  console.log("🌱 COMPREHENSIVE DATABASE SEED");
  console.log("=".repeat(60));
  console.log("Starting comprehensive multi-layer seeding process...\n");

  try {
    // 0. Cleanup dependent tables first (to avoid foreign key constraints)
    logStep("🧹", "Cleaning up dependent tables...");
    // Layer 3 cleanup
    await prisma.assetKitCheckoutItem.deleteMany({});
    await prisma.assetKitCheckout.deleteMany({});
    await prisma.assetKitItem.deleteMany({});
    await prisma.assetKit.deleteMany({});
    await prisma.assetReservationConflict.deleteMany({});
    await prisma.assetReservation.deleteMany({});
    await prisma.disposalDocument.deleteMany({});
    await prisma.disposalApproval.deleteMany({});
    await prisma.assetDisposal.deleteMany({});
    await prisma.cIRelationship.deleteMany({});
    await prisma.configurationItem.deleteMany({});
    await prisma.relationshipType.deleteMany({});
    // Layer 2 cleanup
    await prisma.maintenanceRecord.deleteMany({});
    await prisma.maintenanceSchedule.deleteMany({});
    await prisma.warranty.deleteMany({});
    await prisma.assetAssignment.deleteMany({});
    await prisma.stockMovement.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.assetModel.deleteMany({});
    await prisma.assetCategory.deleteMany({});
    await prisma.stockLocation.deleteMany({});
    // Layer 1 cleanup (Foundation)
    await prisma.personRoleAssignment.deleteMany({});
    await prisma.person.deleteMany({});
    await prisma.fieldDefinition.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.organizationUnit.deleteMany({});
    await prisma.vendorContact.deleteMany({});
    await prisma.vendor.deleteMany({});
    await prisma.lifecycleTransition.deleteMany({});
    await prisma.lifecycleState.deleteMany({});
    await prisma.lifecycleModel.deleteMany({});
    // Infrastructure cleanup
    await prisma.codeSequence.deleteMany({});
    logSuccess("Dependent tables cleaned");
    console.log("");

    // 0.5. Initialize Code Sequence table
    logSection("Code Sequence Initialization");
    logStep("🔢", "Initializing code sequences for auto-generation...");

    const sequenceConfigs = [
      { entityType: "VENDOR", prefix: "VENDOR" },
      { entityType: "ASSET", prefix: "ASSET" },
      { entityType: "ORGANIZATION_UNIT", prefix: "ORG" },
      { entityType: "LOCATION", prefix: "LOC" },
      { entityType: "LIFECYCLE_STATE", prefix: "STATE" },
      { entityType: "CI_CLASS", prefix: "CI" },
      { entityType: "RELATIONSHIP_TYPE", prefix: "REL" },
      { entityType: "ASSET_CATEGORY", prefix: "CAT" },
      { entityType: "ASSET_MODEL", prefix: "MODEL" },
      { entityType: "STOCK_LOCATION", prefix: "STOCK" },
      { entityType: "ASSET_KIT", prefix: "KIT" },
      { entityType: "CONTRACT_TYPE", prefix: "CTYPE" },
      { entityType: "LICENSE_PRODUCT", prefix: "LIC" },
    ];

    for (const config of sequenceConfigs) {
      await prisma.codeSequence.create({
        data: {
          entityType: config.entityType,
          prefix: config.prefix,
          lastNumber: 0,
        },
      });
    }

    logSuccess(`Initialized ${sequenceConfigs.length} code sequences`);
    console.log("");

    // 1. Seed RBAC (roles, permissions, assignments)
    await seedRBAC();
    console.log("");

    // 2. Seed Foundation (lifecycle, vendors, org units, locations, persons, fields)
    await seedFoundation(prisma);
    console.log("");

    // 3. Seed Assets (categories, models, assets, stock locations, movements, assignments)
    await seedAssets(prisma);
    console.log("");

    // 4. Seed Warranties & Maintenance (warranties, schedules, records)
    await seedWarrantiesMaintenance(prisma);
    console.log("");

    // 5. Seed CMDB Relationship Types (for Layer 3 to reference)
    await seedCMDB(prisma);
    console.log("");

    // 6. Seed Layer 3 ITAM (disposals, asset kits, reservations, complete CMDB with CIs and relationships)
    await seedLayer3ITAM(prisma);
    console.log("");

    // 7. Seed AI prompt templates
    logSection("AI Prompt Templates");
    logStep("🤖", "Seeding AI prompt templates...");
    await seedPrompts(prisma);
    logSuccess("AI prompt templates seeded");
    console.log("");

    // 8. Seed example tasks
    logSection("Example Tasks");
    logStep("📝", "Creating example tasks...");

    // Delete existing tasks
    await prisma.task.deleteMany({});

    const exampleTasks = [
      {
        title: "Welcome to Barq Assets!",
        description:
          "This is an example task demonstrating the Clean Architecture pattern. " +
          "Explore the Task entity, repository, and use cases to understand how the architecture works.",
        status: TaskStatus.COMPLETED,
      },
      {
        title: "Set up your development environment",
        description:
          "1. Configure your DATABASE_URL in .env.local\n" +
          "2. Add your OPENAI_API_KEY\n" +
          "3. Run npm run db:push\n" +
          "4. Run npm run dev",
        status: TaskStatus.COMPLETED,
      },
      {
        title: "Explore the Task CRUD example",
        description:
          "Check out src/core/domain/entities/task.entity.ts to see how domain entities work. " +
          "Then look at the use cases, repository, and how they all tie together with DI.",
        status: TaskStatus.IN_PROGRESS,
      },
      {
        title: "Build your first feature",
        description:
          "Use the Task CRUD as a template to create your own features. " +
          "Follow the same pattern: Entity → Repository → Use Cases → Controller → UI.",
        status: TaskStatus.PENDING,
      },
      {
        title: "Customize the theme",
        description:
          "Update the barq brand colors in src/lib/theme/constants.ts to match your brand. " +
          "The theme system uses OKLCH color space for perceptually uniform colors.",
        status: TaskStatus.PENDING,
      },
    ];

    // Create tasks
    await prisma.task.createMany({
      data: exampleTasks,
    });

    logSuccess(`Created ${exampleTasks.length} example tasks`);

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
