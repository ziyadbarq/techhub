/**
 * Layer 3 Advanced ITAM Seed Data
 *
 * Seeds:
 * - Asset disposals with approvals
 * - Asset kits and checkouts with individual item tracking
 * - Asset reservations (with a sample conflict)
 *
 * CMDB seeding is intentionally skipped until the schema alignment is completed.
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import {
  AssetDisposalFactory,
  AssetKitFactory,
  AssetReservationFactory,
} from "./seed-factories/index.js";
import {
  DISPOSAL_TYPES,
  DISPOSAL_STATUSES,
  DISPOSAL_REASONS,
  KIT_TYPES,
  RESERVATION_PURPOSES,
} from "./seed-config.js";
import { getRelativeDate } from "./seed-utils.js";

export async function seedLayer3ITAM(prisma: PrismaClient) {
  console.log("🚀 Seeding Layer 3 ITAM features...");

  // Note: Cleanup is handled by main seed.ts orchestrator

  const assets = await prisma.asset.findMany({
    include: { assetCategory: true, lifecycleState: true },
  });
  const persons = await prisma.person.findMany({});

  if (assets.length === 0 || persons.length === 0) {
    throw new Error(
      "Required data not found. Run foundation and asset seeders first.",
    );
  }

  const retiredAssets = assets.filter(
    (a) => a.lifecycleState?.code === "RETIRED",
  );
  const availableAssets = assets.filter(
    (a) => a.lifecycleState?.code === "RECEIVED",
  );
  const laptops = assets.filter((a) => a.assetCategory.code === "LAPTOP");
  const phones = assets.filter((a) => a.assetCategory.code === "PHONE");
  const today = new Date();

  // ==============================================
  // 1. ASSET DISPOSALS
  // ==============================================
  console.log("   🗑️  Seeding asset disposals...");

  if (retiredAssets[0]) {
    const disposal = await new AssetDisposalFactory({
      assetId: retiredAssets[0].id,
      disposalType: DISPOSAL_TYPES.RECYCLING,
      reason: DISPOSAL_REASONS[0],
      initiatedById: persons[0].id,
      estimatedValue: 25,
      status: DISPOSAL_STATUSES.PENDING_APPROVAL,
      currency: "SAR",
      note: "Laptop showing hardware failures, needs replacement",
    }).create(prisma);

    await prisma.disposalApproval.create({
      data: {
        disposalId: disposal.id,
        approverId: persons[1]?.id ?? persons[0].id,
        status: "PENDING",
      },
    });
  }

  if (retiredAssets[1]) {
    const disposal = await new AssetDisposalFactory({
      assetId: retiredAssets[1].id,
      disposalType: DISPOSAL_TYPES.DONATION,
      reason: "Functional but outdated, donate to school",
      initiatedById: persons[1]?.id ?? persons[0].id,
      approvedById: persons[1]?.id ?? persons[0].id,
      approvedAt: getRelativeDate(-7),
      estimatedValue: 150,
      status: DISPOSAL_STATUSES.APPROVED,
      currency: "SAR",
      note: "Approved for donation",
    }).create(prisma);

    await prisma.disposalApproval.create({
      data: {
        disposalId: disposal.id,
        approverId: persons[1]?.id ?? persons[0].id,
        decisionAt: getRelativeDate(-7),
        status: "APPROVED",
        comment: "Donation approved",
      },
    });
  }

  if (retiredAssets[2]) {
    await new AssetDisposalFactory({
      assetId: retiredAssets[2].id,
      disposalType: DISPOSAL_TYPES.RECYCLING,
      reason: "End of life equipment - sanitization in progress",
      initiatedById: persons[0].id,
      approvedById: persons[1]?.id ?? persons[0].id,
      approvedAt: getRelativeDate(-15),
      estimatedValue: 10,
      status: DISPOSAL_STATUSES.IN_PROGRESS,
      currency: "SAR",
      sanitizationChecklist: {
        checkedItems: ["Disk wiped", "Audit trail recorded"],
        completedAt: getRelativeDate(-2),
        performedById: persons[2]?.id ?? persons[0].id,
      },
      note: "Awaiting pickup by recycler",
    }).create(prisma);
  }

  if (retiredAssets[3]) {
    await new AssetDisposalFactory({
      assetId: retiredAssets[3].id,
      disposalType: DISPOSAL_TYPES.RECYCLING,
      reason: "Damaged beyond repair",
      initiatedById: persons[0].id,
      approvedById: persons[1]?.id ?? persons[0].id,
      approvedAt: getRelativeDate(-25),
      estimatedValue: 5,
      status: DISPOSAL_STATUSES.IN_PROGRESS,
      currency: "SAR",
      sanitizationChecklist: {
        checkedItems: ["Physical destruction - drive shredded"],
        completedAt: getRelativeDate(-5),
        performedById: persons[2]?.id ?? persons[0].id,
      },
      note: "Ready for e-waste recycling",
    }).create(prisma);
  }

  if (laptops[10]) {
    await new AssetDisposalFactory({
      assetId: laptops[10].id,
      disposalType: DISPOSAL_TYPES.SALE,
      reason: "Surplus equipment - still functional",
      initiatedById: persons[0].id,
      approvedById: persons[1]?.id ?? persons[0].id,
      approvedAt: getRelativeDate(-55),
      estimatedValue: 300,
      actualProceeds: 275,
      status: DISPOSAL_STATUSES.COMPLETED,
      disposalDate: getRelativeDate(-10),
      sanitizationChecklist: {
        checkedItems: ["Secure erase - ATA Secure Erase"],
        completedAt: getRelativeDate(-45),
        performedById: persons[0].id,
      },
      currency: "SAR",
      note: "Sold via auction; funds returned to IT budget",
    }).create(prisma);
  }

  console.log("   ✓ Asset disposals seeded");

  // ==============================================
  // 2. ASSET KITS
  // ==============================================
  console.log("   📦 Seeding asset kits...");

  const newHireKit = await AssetKitFactory.createWithItems(
    prisma,
    {
      name: "New Hire - Developer Kit",
      code: "KIT-DEV-001",
      description: "Laptop and dual monitors for developers",
      kitType: KIT_TYPES.NEW_HIRE,
      isActive: true,
    },
    [
      {
        assetCategoryId: laptops[0]?.assetCategoryId,
        quantity: 1,
        isRequired: true,
        note: "Primary laptop",
      },
      {
        assetCategoryId: assets.find((a) => a.assetCategory.code === "MONITOR")
          ?.assetCategoryId,
        quantity: 2,
        isRequired: true,
        note: "Dual monitors",
      },
    ],
  );

  const remoteKit = await AssetKitFactory.createWithItems(
    prisma,
    {
      name: "Remote Worker Kit",
      code: "KIT-REMOTE-001",
      description: "Laptop and monitor for remote staff",
      kitType: KIT_TYPES.CONTRACTOR, // Using CONTRACTOR as "REMOTE" is not in enum
      isActive: true,
    },
    [
      {
        assetCategoryId: laptops[1]?.assetCategoryId,
        quantity: 1,
        isRequired: true,
      },
      {
        assetCategoryId: assets.find((a) => a.assetCategory.code === "MONITOR")
          ?.assetCategoryId,
        quantity: 1,
        isRequired: true,
      },
    ],
  );

  console.log("   ✓ Asset kits seeded");

  // ==============================================
  // 3. ASSET KIT CHECKOUTS
  // ==============================================
  console.log("   🛒 Seeding asset kit checkouts...");

  // Get kit items for both kits
  const newHireKitItems = await prisma.assetKitItem.findMany({
    where: { assetKitId: newHireKit.id },
  });
  const remoteKitItems = await prisma.assetKitItem.findMany({
    where: { assetKitId: remoteKit.id },
  });

  if (availableAssets.length >= 3 && newHireKitItems.length > 0) {
    const checkout1 = await prisma.assetKitCheckout.create({
      data: {
        assetKitId: newHireKit.id,
        assigneeType: "PERSON",
        assigneeId: persons[0].id,
        checkedOutById: persons[1]?.id ?? persons[0].id,
        checkoutDate: getRelativeDate(-30),
        status: "CHECKED_OUT",
        note: "New hire onboarding kit issued",
      },
    });

    // Create checkout items for each asset in the kit
    for (const kitItem of newHireKitItems) {
      const asset =
        availableAssets.find(
          (a) => a.assetCategoryId === kitItem.assetCategoryId,
        ) ?? availableAssets[0];

      await prisma.assetKitCheckoutItem.create({
        data: {
          kitCheckoutId: checkout1.id,
          assetId: asset.id,
          kitItemId: kitItem.id,
          checkoutDate: getRelativeDate(-30),
          status: "CHECKED_OUT",
          conditionAtCheckout: "GOOD - All items inspected and functional",
        },
      });
    }
  }

  if (availableAssets.length >= 5 && remoteKitItems.length > 0) {
    const checkout2 = await prisma.assetKitCheckout.create({
      data: {
        assetKitId: remoteKit.id,
        assigneeType: "PERSON",
        assigneeId: persons[2]?.id ?? persons[0].id,
        checkedOutById: persons[0].id,
        checkoutDate: getRelativeDate(-10),
        actualReturnDate: getRelativeDate(-2),
        status: "RETURNED",
        note: "Remote kit returned in good condition",
      },
    });

    // Create checkout items for returned kit
    for (const kitItem of remoteKitItems) {
      const asset =
        availableAssets.find(
          (a) => a.assetCategoryId === kitItem.assetCategoryId,
        ) ?? availableAssets[1];

      await prisma.assetKitCheckoutItem.create({
        data: {
          kitCheckoutId: checkout2.id,
          assetId: asset.id,
          kitItemId: kitItem.id,
          checkoutDate: getRelativeDate(-10),
          returnDate: getRelativeDate(-2),
          status: "RETURNED",
          conditionAtCheckout: "GOOD - All items inspected and functional",
          conditionAtReturn: "GOOD - All items returned in good condition",
        },
      });
    }
  }

  console.log("   ✓ Asset kit checkouts seeded");

  // ==============================================
  // 4. ASSET RESERVATIONS
  // ==============================================
  console.log("   📅 Seeding asset reservations...");

  if (laptops[0]) {
    await new AssetReservationFactory({
      assetId: laptops[0].id,
      reservedById: persons[0].id,
      reservedForPersonId: persons[0].id,
      startDate: getRelativeDate(7),
      endDate: getRelativeDate(14),
      purpose: RESERVATION_PURPOSES[0], // Business travel
      status: "CONFIRMED",
      confirmationDate: today,
      confirmedById: persons[1]?.id ?? persons[0].id,
      note: "High-spec laptop reserved for demo",
    }).create(prisma);
  }

  if (laptops[1]) {
    await new AssetReservationFactory({
      assetId: laptops[1].id,
      reservedById: persons[2]?.id ?? persons[0].id,
      reservedForPersonId: persons[2]?.id ?? persons[0].id,
      startDate: getRelativeDate(10),
      endDate: getRelativeDate(12),
      purpose: RESERVATION_PURPOSES[3], // Training session
      status: "PENDING",
      note: "Awaiting approval",
    }).create(prisma);
  }

  if (phones[0]) {
    await new AssetReservationFactory({
      assetId: phones[0].id,
      reservedById: persons[1]?.id ?? persons[0].id,
      reservedForPersonId: persons[1]?.id ?? persons[0].id,
      startDate: getRelativeDate(-2),
      endDate: getRelativeDate(5),
      purpose: RESERVATION_PURPOSES[2], // Equipment testing
      status: "ACTIVE",
      confirmationDate: getRelativeDate(-10),
      confirmedById: persons[0].id,
      note: "Testing new mobile release",
    }).create(prisma);
  }

  if (laptops[2]) {
    const reservationA = await new AssetReservationFactory({
      assetId: laptops[2].id,
      reservedById: persons[0].id,
      reservedForPersonId: persons[0].id,
      startDate: getRelativeDate(15),
      endDate: getRelativeDate(20),
      purpose: "Sales tour - week 1",
      status: "CONFIRMED",
      confirmationDate: today,
      confirmedById: persons[1]?.id ?? persons[0].id,
    }).create(prisma);

    const reservationB = await new AssetReservationFactory({
      assetId: laptops[2].id,
      reservedById: persons[2]?.id ?? persons[0].id,
      reservedForPersonId: persons[2]?.id ?? persons[0].id,
      startDate: getRelativeDate(18),
      endDate: getRelativeDate(25),
      purpose: "Training workshop - week 2",
      status: "PENDING",
      note: "Potential overlap with existing reservation",
    }).create(prisma);

    await prisma.assetReservationConflict.create({
      data: {
        reservationId: reservationA.id,
        conflictingReservationId: reservationB.id,
        detectedAt: today,
        resolutionNote:
          "Overlapping reservations detected. Resolve before approval.",
      },
    });
  }

  console.log("   ✓ Asset reservations seeded");
  console.log("   🗄️  CMDB seeding skipped (schema alignment pending)");
  console.log("   ✅ Layer 3 ITAM seeding completed");
}
