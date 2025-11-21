/**
 * Asset Layer Seed Data (Layer 2)
 *
 * Seeds comprehensive asset management data:
 * - Asset Categories (8 types)
 * - Asset Models (15 models across vendors)
 * - Assets (50+ realistic assets)
 * - Stock Locations (5 locations)
 * - Stock Movements (inventory tracking)
 * - Asset Assignments (70% assignment rate)
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import {
  logSection,
  logStep,
  logSuccess,
  logWarning,
  requireEntities,
  optionalConnect,
  requireConnect,
  pickRandom,
  randomInt,
  getRelativeDateByYears,
  generateAssetTag,
  generateSerialNumber,
} from "./seed-utils.js";
import { SEED_CONFIG } from "./seed-config.js";

/**
 * Seed Asset Layer entities
 */
export async function seedAssets(prisma: PrismaClient) {
  logSection("Asset Layer (Layer 2)");

  // ==============================================
  // Prerequisites Check
  // ==============================================
  const vendors = await prisma.vendor.findMany({});
  const locations = await prisma.location.findMany({});
  const persons = await prisma.person.findMany({});
  const lifecycleStates = await prisma.lifecycleState.findMany({});

  requireEntities(vendors, "vendors");
  requireEntities(locations, "locations");
  requireEntities(persons, "persons");

  // Create vendor lookup map
  const vendorMap = new Map(vendors.map((v) => [v.code, v]));

  // ==============================================
  // 1. Asset Categories
  // ==============================================
  logStep("📦", "Creating asset categories...");

  const categoryMap = new Map<
    string,
    { id: string; code: string; name: string }
  >();

  for (const catData of SEED_CONFIG.ASSET_CATEGORIES) {
    const category = await prisma.assetCategory.create({
      data: {
        name: catData.name,
        code: catData.code,
        description: catData.description,
      },
    });
    categoryMap.set(catData.code, category);
  }

  logSuccess(`Created ${categoryMap.size} asset categories`);

  // ==============================================
  // 2. Asset Models
  // ==============================================
  logStep("🏭", "Creating asset models...");

  const modelMap = new Map<string, string>();

  for (const [categoryCode, models] of Object.entries(
    SEED_CONFIG.ASSET_MODELS,
  )) {
    const category = categoryMap.get(categoryCode);
    if (!category) {
      logWarning(`Category ${categoryCode} not found, skipping models`);
      continue;
    }

    for (const modelData of models) {
      const vendor = vendorMap.get(modelData.vendor);

      if (!vendor) {
        logWarning(
          `Vendor ${modelData.vendor} not found, skipping model ${modelData.name}`,
        );
        continue;
      }

      const model = await prisma.assetModel.create({
        data: {
          ...requireConnect(category.id, "assetCategory"),
          ...requireConnect(vendor.id, "vendor"),
          name: modelData.name,
          code: modelData.code,
          description: modelData.description,
        },
      });

      modelMap.set(`${categoryCode}-${modelData.code}`, model.id);
    }
  }

  logSuccess(`Created ${modelMap.size} asset models`);

  // ==============================================
  // 3. Assets
  // ==============================================
  logStep("💻", "Creating assets...");

  const assets: Array<{ id: string; categoryCode: string }> = [];
  let totalAssets = 0;

  for (const [categoryCode, quantity] of Object.entries(
    SEED_CONFIG.QUANTITIES.ASSETS_PER_CATEGORY,
  )) {
    const category = categoryMap.get(categoryCode);
    if (!category) {
      logWarning(`Category ${categoryCode} not found, skipping assets`);
      continue;
    }

    // Get models for this category
    const categoryModels = Array.from(modelMap.entries())
      .filter(([key]) => key.startsWith(`${categoryCode}-`))
      .map(([_, modelId]) => modelId);

    if (categoryModels.length === 0) {
      logWarning(`No models found for ${categoryCode}, creating without model`);
    }

    // Create assets for this category
    for (let i = 1; i <= quantity; i++) {
      const assetTag = generateAssetTag(categoryCode, totalAssets + i);
      const serialNumber = generateSerialNumber(
        categoryCode,
        new Date().getFullYear(),
        totalAssets + i,
      );
      const modelId =
        categoryModels.length > 0 ? pickRandom(categoryModels) : undefined;
      const purchaseDate = getRelativeDateByYears(-randomInt(1, 3));
      const lifecycleState =
        lifecycleStates.find((ls) => ls.code === "DEPLOYED") ??
        pickRandom(lifecycleStates);

      const asset = await prisma.asset.create({
        data: {
          ...requireConnect(category.id, "assetCategory"),
          ...optionalConnect(modelId, "assetModel"),
          assetTag,
          serialNumber,
          purchaseDate,
          purchaseCost: randomInt(500, 5000),
          currency: "SAR",
          ...optionalConnect(lifecycleState?.id, "lifecycleState"),
          condition: pickRandom(["NEW", "GOOD", "FAIR"] as const),
        },
      });

      assets.push({ id: asset.id, categoryCode });
    }

    totalAssets += quantity;
  }

  logSuccess(`Created ${assets.length} assets`);

  // ==============================================
  // 4. Stock Locations
  // ==============================================
  logStep("📍", "Creating stock locations...");

  const stockLocations = [];

  const stockLocationData = [
    {
      name: "Main Warehouse - Riyadh",
      code: "WH-RUH-01",
      description: "Primary warehouse for IT assets",
    },
    {
      name: "IT Storage - Headquarters",
      code: "IT-HQ-01",
      description: "HQ IT department storage",
    },
    {
      name: "Server Room - Data Center",
      code: "DC-RUH-01",
      description: "Data center storage area",
    },
    {
      name: "Branch Storage - Jeddah",
      code: "BR-JED-01",
      description: "Jeddah branch storage facility",
    },
    {
      name: "Asset Receiving Area",
      code: "RECV-01",
      description: "Incoming asset receiving dock",
    },
  ];

  for (const locData of stockLocationData) {
    const location = await prisma.stockLocation.create({
      data: {
        name: locData.name,
        code: locData.code,
        description: locData.description,
      },
    });
    stockLocations.push(location);
  }

  logSuccess(`Created ${stockLocations.length} stock locations`);

  // ==============================================
  // 5. Stock Movements
  // ==============================================
  logStep("📦", "Creating stock movements...");

  let movementCount = 0;

  // Create movements for subset of assets
  const assetsForMovement = assets.slice(0, Math.floor(assets.length * 0.3)); // 30% have movements

  for (const asset of assetsForMovement) {
    const stockLocation = pickRandom(stockLocations);
    const person = pickRandom(persons);

    await prisma.stockMovement.create({
      data: {
        ...requireConnect(asset.id, "asset"),
        ...requireConnect(stockLocation.id, "stockLocationTo"),
        movementType: "IN",
        occurredAt: getRelativeDateByYears(-1),
        ...requireConnect(person.id, "performedBy"),
        reason: `Initial stock receipt`,
      },
    });

    movementCount++;
  }

  logSuccess(`Created ${movementCount} stock movements`);

  // ==============================================
  // 6. Asset Assignments
  // ==============================================
  logStep("👤", "Creating asset assignments...");

  const assignmentPercentage =
    SEED_CONFIG.QUANTITIES.ASSET_ASSIGNMENTS_PERCENTAGE;
  const assetsToAssign = assets.slice(
    0,
    Math.floor(assets.length * assignmentPercentage),
  );

  let assignmentCount = 0;

  for (const asset of assetsToAssign) {
    const person = pickRandom(persons);

    await prisma.assetAssignment.create({
      data: {
        ...requireConnect(asset.id, "asset"),
        assigneeType: "PERSON",
        assigneeId: person.id,
        startDate: getRelativeDateByYears(-randomInt(0, 2)),
        note: `Assigned for ${pickRandom(["daily work", "project use", "testing", "development"])}`,
      },
    });

    assignmentCount++;
  }

  logSuccess(`Created ${assignmentCount} asset assignments`);

  // ==============================================
  // Summary
  // ==============================================
  logSuccess("Asset Layer seeding completed");
  console.log("\nSummary:");
  console.log(`   - ${categoryMap.size} asset categories`);
  console.log(`   - ${modelMap.size} asset models`);
  console.log(`   - ${assets.length} assets`);
  console.log(`   - ${stockLocations.length} stock locations`);
  console.log(`   - ${movementCount} stock movements`);
  console.log(
    `   - ${assignmentCount} asset assignments (${Math.round(assignmentPercentage * 100)}% assigned)`,
  );
}
