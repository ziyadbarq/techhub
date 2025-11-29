/**
 * Asset Layer Seed Data (Layer 2)
 *
 * Split into two functions:
 * - seedAssetConfig(): Categories, models, stock locations (production-safe)
 * - seedDemoAssets(): Demo assets with assignments (dev-only)
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
 * Seed Asset Config (Production-safe)
 *
 * Seeds asset categories, models, and stock locations.
 * No demo assets or assignments.
 */
export async function seedAssetConfig(prisma: PrismaClient) {
  logSection("Asset Config (Production)");

  // ==============================================
  // Prerequisites Check
  // ==============================================
  const vendors = await prisma.vendor.findMany({});

  requireEntities(vendors, "vendors");

  // Create vendor lookup map
  const vendorMap = new Map(vendors.map((v) => [v.code, v]));

  // ==============================================
  // 1. Asset Categories (idempotent - uses upsert)
  // ==============================================
  logStep("📦", "Creating asset categories...");

  const categoryMap = new Map<
    string,
    { id: string; code: string; name: string }
  >();

  for (const catData of SEED_CONFIG.ASSET_CATEGORIES) {
    const category = await prisma.assetCategory.upsert({
      where: { code: catData.code },
      create: {
        name: catData.name,
        code: catData.code,
        description: catData.description,
      },
      update: {}, // No-op update to preserve existing data
    });
    categoryMap.set(catData.code, category);
  }

  logSuccess(`Processed ${categoryMap.size} asset categories`);

  // ==============================================
  // 1b. Asset Category Fields (link field definitions to categories)
  // ==============================================
  logStep("📋", "Linking field definitions to categories...");

  // Get all field definitions (name field stores the code from config)
  const fieldDefinitions = await prisma.fieldDefinition.findMany({
    select: { id: true, name: true },
  });
  const fieldDefMap = new Map(fieldDefinitions.map((f) => [f.name, f.id]));

  let categoryFieldCount = 0;

  for (const [categoryCode, fieldCodes] of Object.entries(
    SEED_CONFIG.ASSET_CATEGORY_FIELD_MAPPINGS,
  )) {
    const category = categoryMap.get(categoryCode);
    if (!category) continue;

    for (let i = 0; i < fieldCodes.length; i++) {
      const fieldCode = fieldCodes[i];
      const fieldDefinitionId = fieldDefMap.get(fieldCode);

      if (!fieldDefinitionId) {
        logWarning(`Field definition ${fieldCode} not found, skipping`);
        continue;
      }

      // Check if already linked (idempotent)
      const existing = await prisma.assetCategoryField.findFirst({
        where: {
          assetCategoryId: category.id,
          fieldDefinitionId,
        },
      });

      if (existing) {
        categoryFieldCount++;
        continue;
      }

      await prisma.assetCategoryField.create({
        data: {
          assetCategoryId: category.id,
          fieldDefinitionId,
          uiOrder: i + 1,
          isRequired: false,
        },
      });

      categoryFieldCount++;
    }
  }

  logSuccess(`Processed ${categoryFieldCount} category-field links`);

  // ==============================================
  // 2. Asset Models (idempotent - uses upsert)
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

      const model = await prisma.assetModel.upsert({
        where: { code: modelData.code },
        create: {
          ...requireConnect(category.id, "assetCategory"),
          ...requireConnect(vendor.id, "vendor"),
          name: modelData.name,
          code: modelData.code,
          description: modelData.description,
        },
        update: {}, // No-op update to preserve existing data
      });

      modelMap.set(`${categoryCode}-${modelData.code}`, model.id);
    }
  }

  logSuccess(`Processed ${modelMap.size} asset models`);

  // ==============================================
  // 3. Stock Locations (idempotent - uses upsert)
  // ==============================================
  logStep("📍", "Creating stock locations...");

  // Single main warehouse - add more locations via UI or data import
  const stockLocationData = [
    {
      name: "Main Warehouse",
      code: "MAIN-WH",
      description: "Primary IT asset warehouse",
    },
  ];

  let stockLocationCount = 0;
  for (const locData of stockLocationData) {
    await prisma.stockLocation.upsert({
      where: { code: locData.code },
      create: {
        name: locData.name,
        code: locData.code,
        description: locData.description,
      },
      update: {}, // No-op update to preserve existing data
    });
    stockLocationCount++;
  }

  logSuccess(`Processed ${stockLocationCount} stock locations`);

  // ==============================================
  // Summary
  // ==============================================
  logSuccess("Asset Config seeding completed");
  console.log("\nSummary:");
  console.log(`   - ${categoryMap.size} asset categories`);
  console.log(`   - ${categoryFieldCount} category-field links`);
  console.log(`   - ${modelMap.size} asset models`);
  console.log(`   - ${stockLocationCount} stock locations`);
}

/**
 * Seed Demo Assets (Dev-only)
 *
 * Seeds 50+ demo assets with assignments and stock movements.
 * Requires ASSET_CONFIG and DEMO_PERSONS to be seeded first.
 */
export async function seedDemoAssets(prisma: PrismaClient) {
  logSection("Demo Assets (Dev Only)");

  // ==============================================
  // Prerequisites Check
  // ==============================================
  const persons = await prisma.person.findMany({});
  const lifecycleStates = await prisma.lifecycleState.findMany({});
  const categories = await prisma.assetCategory.findMany({});
  const models = await prisma.assetModel.findMany({});
  const stockLocations = await prisma.stockLocation.findMany({});

  requireEntities(persons, "persons");
  requireEntities(categories, "asset categories");
  requireEntities(stockLocations, "stock locations");

  // Create lookup maps
  const categoryMap = new Map(categories.map((c) => [c.code, c]));
  const modelsByCategory = new Map<string, string[]>();
  for (const model of models) {
    const category = categories.find((c) => c.id === model.assetCategoryId);
    if (category) {
      const existing = modelsByCategory.get(category.code) || [];
      existing.push(model.id);
      modelsByCategory.set(category.code, existing);
    }
  }

  // ==============================================
  // 1. Assets (idempotent - uses upsert)
  // ==============================================
  logStep("💻", "Creating demo assets...");

  const assets: Array<{ id: string; categoryCode: string }> = [];
  let totalAssets = 0;

  // Load existing assets to support append mode
  const existingAssets = await prisma.asset.findMany({
    select: { id: true, assetTag: true, assetCategoryId: true },
  });
  const existingAssetTags = new Set(existingAssets.map((a) => a.assetTag));

  for (const [categoryCode, quantity] of Object.entries(
    SEED_CONFIG.QUANTITIES.ASSETS_PER_CATEGORY,
  )) {
    const category = categoryMap.get(categoryCode);
    if (!category) {
      logWarning(`Category ${categoryCode} not found, skipping assets`);
      continue;
    }

    // Get models for this category
    const categoryModels = modelsByCategory.get(categoryCode) || [];

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

      // Check if asset already exists (idempotent)
      if (existingAssetTags.has(assetTag)) {
        const existingAsset = existingAssets.find(
          (a) => a.assetTag === assetTag,
        );
        if (existingAsset) {
          assets.push({ id: existingAsset.id, categoryCode });
        }
        totalAssets++;
        continue;
      }

      const modelId =
        categoryModels.length > 0 ? pickRandom(categoryModels) : undefined;
      const purchaseDate = getRelativeDateByYears(-randomInt(1, 3));
      const lifecycleState =
        lifecycleStates.find((ls) => ls.code === "DEPLOYED") ??
        pickRandom(lifecycleStates);

      const asset = await prisma.asset.upsert({
        where: { assetTag },
        create: {
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
        update: {}, // No-op update to preserve existing data
      });

      assets.push({ id: asset.id, categoryCode });
    }

    totalAssets += quantity;
  }

  logSuccess(`Processed ${assets.length} demo assets`);

  // ==============================================
  // 2. Stock Movements (idempotent - check before create)
  // ==============================================
  logStep("📦", "Creating stock movements...");

  let movementCount = 0;

  // Create movements for subset of assets
  const assetsForMovement = assets.slice(0, Math.floor(assets.length * 0.3)); // 30% have movements

  for (const asset of assetsForMovement) {
    // Check if initial movement already exists for this asset (idempotent)
    const existingMovement = await prisma.stockMovement.findFirst({
      where: {
        assetId: asset.id,
        movementType: "IN",
        reason: "Initial stock receipt",
      },
    });

    if (existingMovement) {
      movementCount++;
      continue; // Skip duplicate
    }

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

  logSuccess(`Processed ${movementCount} stock movements`);

  // ==============================================
  // 3. Asset Assignments (idempotent - check before create)
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
    // Check if active assignment already exists for this asset (idempotent)
    const existingAssignment = await prisma.assetAssignment.findFirst({
      where: {
        assetId: asset.id,
        endDate: null, // Active assignment
      },
    });

    if (existingAssignment) {
      assignmentCount++;
      continue; // Skip duplicate
    }

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

  logSuccess(`Processed ${assignmentCount} asset assignments`);

  // ==============================================
  // Summary
  // ==============================================
  logSuccess("Demo Assets seeding completed");
  console.log("\nSummary:");
  console.log(`   - ${assets.length} demo assets`);
  console.log(`   - ${movementCount} stock movements`);
  console.log(
    `   - ${assignmentCount} asset assignments (${Math.round(assignmentPercentage * 100)}% assigned)`,
  );
}
