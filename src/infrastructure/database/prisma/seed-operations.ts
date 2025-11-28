/**
 * Shared Seed Operations
 *
 * Common database operations used by both automatic and interactive seed scripts.
 * Extracted to avoid duplication and ensure consistency.
 *
 * NOTE: All seeders are FULLY IDEMPOTENT:
 * - Never wipe existing data
 * - Never create duplicates (use upsert/check-before-create)
 * - Safe to run multiple times
 *
 * Use `npm run db:reset` when you need a clean slate (drops ALL data).
 */

import {
  TaskStatus,
  type PrismaClient,
} from "../../../generated/prisma/client.js";

/**
 * Perform full database cleanup (all tables)
 *
 * @deprecated Use `npm run db:reset` instead, which uses `prisma db push --force-reset`.
 * This function is kept for backwards compatibility and testing purposes only.
 *
 * Order is critical to respect foreign key constraints
 */
export async function performFullCleanup(prisma: PrismaClient): Promise<void> {
  // Feature flags cleanup (no foreign keys)
  await prisma.featureFlagAuditLog.deleteMany({});
  await prisma.featureFlag.deleteMany({});

  // Service Management cleanup
  await prisma.serviceAsset.deleteMany({});
  await prisma.serviceInfrastructure.deleteMany({});
  await prisma.serviceOwnership.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.businessProcess.deleteMany({});

  // Layer 3 cleanup
  await prisma.attachment.deleteMany({});
  await prisma.attachmentType.deleteMany({});
  await prisma.verificationItem.deleteMany({});
  await prisma.verificationCampaign.deleteMany({});
  await prisma.dataOwnership.deleteMany({});
  await prisma.dataDomain.deleteMany({});
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
  await prisma.task.deleteMany({});
}

/**
 * Initialize code sequences for auto-generation
 * Safe to call multiple times (checks if already initialized)
 */
export async function initializeCodeSequences(
  prisma: PrismaClient,
): Promise<number> {
  // Check if already initialized
  const existing = await prisma.codeSequence.count();
  if (existing > 0) {
    return existing;
  }

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

  return sequenceConfigs.length;
}

/**
 * Seed example tasks for demonstration (idempotent - check before create)
 */
export async function seedExampleTasks(prisma: PrismaClient): Promise<number> {
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

  // Check existing tasks to avoid duplicates (idempotent)
  const existingTasks = await prisma.task.findMany({
    select: { title: true },
  });
  const existingTitles = new Set(existingTasks.map((t) => t.title));

  const tasksToCreate = exampleTasks.filter(
    (t) => !existingTitles.has(t.title),
  );

  if (tasksToCreate.length > 0) {
    await prisma.task.createMany({
      data: tasksToCreate,
    });
  }

  return tasksToCreate.length;
}
