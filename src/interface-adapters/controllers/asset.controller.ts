/**
 * Asset Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateAssetSchema,
  UpdateAssetSchema,
  AssetSearchSchema,
  type CreateAssetDTO,
  type UpdateAssetDTO,
  type AssetSearchDTO,
} from "../dtos/generated/asset.dto";
import { presentAsset, type AssetDTO } from "../presenters/asset.presenter";
import type {
  CreateAssetUseCase,
  ListAssetsUseCase,
  UpdateAssetUseCase,
  DeleteAssetUseCase,
} from "@/core/use-cases/asset/asset";
import type { ILoggerService } from "@/core/services";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { Asset } from "@/core/domain/entities/asset.entity";
import type { ListAssetCategoriesUseCase } from "@/core/use-cases/asset/asset-category";
import type { ListAssetModelsUseCase } from "@/core/use-cases/asset/asset-model";
import type { ListVendorsUseCase } from "@/core/use-cases/foundation/vendor";
import type { ListStockLocationsUseCase } from "@/core/use-cases/inventory/stock-location";
import type { ListLifecycleStatesUseCase } from "@/core/use-cases/foundation/lifecycle-state";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Enrich assets with related entity display data
 */
async function enrichAssets(assets: Asset[]): Promise<AssetDTO[]> {
  if (assets.length === 0) {
    return [];
  }

  const container = getContainer();

  // Collect unique IDs
  const categoryIds = [...new Set(assets.map((a) => a.assetCategoryId))];
  const modelIds = [
    ...new Set(
      assets
        .map((a) => a.assetModelId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const vendorIds = [
    ...new Set(
      assets.map((a) => a.vendorId).filter((id): id is string => id !== null),
    ),
  ];
  const stockLocationIds = [
    ...new Set(
      assets
        .map((a) => a.currentStockLocationId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const lifecycleStateIds = [
    ...new Set(
      assets
        .map((a) => a.lifecycleStateId)
        .filter((id): id is string => id !== null),
    ),
  ];

  // Fetch related entities in parallel
  const [
    categoriesMap,
    modelsMap,
    vendorsMap,
    stockLocationsMap,
    lifecycleStatesMap,
  ] = await Promise.all([
    (async () => {
      const useCase = container.get<ListAssetCategoriesUseCase>(
        DI_TOKENS.ListAssetCategoriesUseCase,
      );
      const categories = await useCase.execute();

      return new Map(
        categories
          .filter((c) => categoryIds.includes(c.id))
          .map((c) => [c.id, c.name]),
      );
    })(),
    (async () => {
      if (modelIds.length === 0) return new Map();

      const useCase = container.get<ListAssetModelsUseCase>(
        DI_TOKENS.ListAssetModelsUseCase,
      );
      const models = await useCase.execute();

      return new Map(
        models
          .filter((m) => modelIds.includes(m.id))
          .map((m) => [m.id, m.name]),
      );
    })(),
    (async () => {
      if (vendorIds.length === 0) return new Map();

      const useCase = container.get<ListVendorsUseCase>(
        DI_TOKENS.ListVendorsUseCase,
      );
      const vendors = await useCase.execute();

      return new Map(
        vendors
          .filter((v) => vendorIds.includes(v.id))
          .map((v) => [v.id, v.name]),
      );
    })(),
    (async () => {
      if (stockLocationIds.length === 0) return new Map();

      const useCase = container.get<ListStockLocationsUseCase>(
        DI_TOKENS.ListStockLocationsUseCase,
      );
      const locations = await useCase.execute();

      return new Map(
        locations
          .filter((l) => stockLocationIds.includes(l.id))
          .map((l) => [l.id, l.name]),
      );
    })(),
    (async () => {
      if (lifecycleStateIds.length === 0) return new Map();

      const useCase = container.get<ListLifecycleStatesUseCase>(
        DI_TOKENS.ListLifecycleStatesUseCase,
      );
      const states = await useCase.execute();

      return new Map(
        states
          .filter((s) => lifecycleStateIds.includes(s.id))
          .map((s) => [s.id, s.name]),
      );
    })(),
  ]);

  // Present assets with enrichment data
  return assets.map((asset) => {
    const categoryName = categoriesMap.get(asset.assetCategoryId) || null;
    const modelName = asset.assetModelId
      ? modelsMap.get(asset.assetModelId) || null
      : null;
    const vendorName = asset.vendorId
      ? vendorsMap.get(asset.vendorId) || null
      : null;
    const stockLocationName = asset.currentStockLocationId
      ? stockLocationsMap.get(asset.currentStockLocationId) || null
      : null;
    const lifecycleStateName = asset.lifecycleStateId
      ? lifecycleStatesMap.get(asset.lifecycleStateId) || null
      : null;

    return presentAsset(asset, {
      categoryName,
      modelName,
      vendorName,
      stockLocationName,
      lifecycleStateName,
    });
  });
}

export async function createAssetAction(
  data: CreateAssetDTO,
): Promise<ActionResponse<AssetDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CREATE);

    const validated = CreateAssetSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateAssetUseCase>(
      DI_TOKENS.CreateAssetUseCase,
    );

    const asset = await useCase.execute({
      assetTag: validated.assetTag,
      assetCategoryId: validated.assetCategoryId,
      assetModelId: validated.assetModelId ?? undefined,
      vendorId: validated.vendorId ?? undefined,
      contractId: validated.contractId ?? undefined,
      lifecycleStateId: validated.lifecycleStateId ?? undefined,
      serialNumber: validated.serialNumber ?? undefined,
      purchaseDate: validated.purchaseDate ?? undefined,
      purchaseCost: validated.purchaseCost ?? undefined,
      currency: validated.currency ?? undefined,
      depreciationModel: validated.depreciationModel ?? undefined,
      depreciationStart: validated.depreciationStart ?? undefined,
      depreciationEnd: validated.depreciationEnd ?? undefined,
      warrantyEndDate: validated.warrantyEndDate ?? undefined,
      currentStockLocationId: validated.currentStockLocationId ?? undefined,
      attributes: validated.attributes ?? undefined,
      note: validated.note ?? undefined,
    });

    revalidatePath("/assets");

    return {
      success: true,
      data: presentAsset(asset),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createAssetAction" },
      "Failed to create asset",
    );
  }
}

export async function listAssetsAction(
  searchOptions?: AssetSearchDTO,
): Promise<ActionResponse<AssetDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const validated = searchOptions
      ? AssetSearchSchema.parse(searchOptions)
      : undefined;

    const container = getContainer();
    const useCase = container.get<ListAssetsUseCase>(
      DI_TOKENS.ListAssetsUseCase,
    );

    const assets = await useCase.execute(validated);

    // Enrich with related entity names
    const enrichedAssets = await enrichAssets(assets);

    return {
      success: true,
      data: enrichedAssets,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAssetsAction" },
      "Failed to list assets",
    );
  }
}

export async function getAssetAction(
  assetTag: string,
): Promise<ActionResponse<AssetDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const repository = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );

    const asset = await repository.findByAssetTag(assetTag);

    if (!asset) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    // Enrich with related entity names
    const [enrichedAsset] = await enrichAssets([asset]);

    return {
      success: true,
      data: enrichedAsset,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetAction", assetTag },
      "Failed to get asset",
    );
  }
}

export async function updateAssetAction(
  assetTag: string,
  data: UpdateAssetDTO,
): Promise<ActionResponse<AssetDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validated = UpdateAssetSchema.parse(data);

    const container = getContainer();
    const repository = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );

    // Find asset by assetTag to get the ID
    const existingAsset = await repository.findByAssetTag(assetTag);
    if (!existingAsset) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    const useCase = container.get<UpdateAssetUseCase>(
      DI_TOKENS.UpdateAssetUseCase,
    );

    const asset = await useCase.execute({
      id: existingAsset.id,
      assetTag: validated.assetTag,
      assetModelId: validated.assetModelId,
      vendorId: validated.vendorId,
      contractId: validated.contractId,
      lifecycleStateId: validated.lifecycleStateId,
      serialNumber: validated.serialNumber,
      purchaseDate: validated.purchaseDate,
      purchaseCost: validated.purchaseCost,
      currency: validated.currency,
      depreciationModel: validated.depreciationModel,
      depreciationStart: validated.depreciationStart,
      depreciationEnd: validated.depreciationEnd,
      warrantyEndDate: validated.warrantyEndDate,
      currentStockLocationId: validated.currentStockLocationId,
      attributes: validated.attributes,
      note: validated.note,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${assetTag}`);
    // Also revalidate the new asset tag if it changed
    if (asset.assetTag !== assetTag) {
      revalidatePath(`/assets/${asset.assetTag}`);
    }

    return {
      success: true,
      data: presentAsset(asset),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateAssetAction", assetTag },
      "Failed to update asset",
    );
  }
}

export async function deleteAssetAction(
  assetTag: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const container = getContainer();
    const repository = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );

    // Find asset by assetTag to get the ID
    const existingAsset = await repository.findByAssetTag(assetTag);
    if (!existingAsset) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    const useCase = container.get<DeleteAssetUseCase>(
      DI_TOKENS.DeleteAssetUseCase,
    );

    await useCase.execute(existingAsset.id);

    revalidatePath("/assets");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteAssetAction", assetTag },
      "Failed to delete asset",
    );
  }
}

/**
 * Bulk create assets from CSV import
 */
export async function bulkCreateAssetsAction(
  assetsData: CreateAssetDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; assetTag: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    const useCase = container.get<CreateAssetUseCase>(
      DI_TOKENS.CreateAssetUseCase,
    );

    const log = logger.child({
      controller: "asset.bulkCreate",
      rows: assetsData.length,
    });
    log.info("Bulk asset import started");

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; assetTag: string; error: string }>,
    };

    // Process assets sequentially to avoid overwhelming the database
    for (let i = 0; i < assetsData.length; i++) {
      const assetData = assetsData[i];
      try {
        const validated = CreateAssetSchema.parse(assetData);

        await useCase.execute({
          assetTag: validated.assetTag,
          assetCategoryId: validated.assetCategoryId,
          assetModelId: validated.assetModelId ?? undefined,
          vendorId: validated.vendorId ?? undefined,
          contractId: validated.contractId ?? undefined,
          lifecycleStateId: validated.lifecycleStateId ?? undefined,
          serialNumber: validated.serialNumber ?? undefined,
          purchaseDate: validated.purchaseDate ?? undefined,
          purchaseCost: validated.purchaseCost ?? undefined,
          currency: validated.currency ?? undefined,
          depreciationModel: validated.depreciationModel ?? undefined,
          depreciationStart: validated.depreciationStart ?? undefined,
          depreciationEnd: validated.depreciationEnd ?? undefined,
          warrantyEndDate: validated.warrantyEndDate ?? undefined,
          currentStockLocationId: validated.currentStockLocationId ?? undefined,
          attributes: validated.attributes ?? undefined,
          note: validated.note ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          assetTag: assetData.assetTag || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/assets");

    log.info("Bulk asset import completed", {
      successCount: results.successCount,
      failureCount: results.failureCount,
      sampleFailure: results.failures[0],
    });

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateAssetsAction" },
      "Failed to bulk create assets",
    );
  }
}

/**
 * Get lookup maps for CSV import
 * Maps codes to IDs for categories, models, vendors, locations, states
 */
export async function getImportLookupMapsAction(): Promise<
  ActionResponse<{
    categoryMap: Record<string, string>;
    modelMap: Record<string, string>;
    vendorMap: Record<string, string>;
    locationMap: Record<string, string>;
    stateMap: Record<string, string>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();

    const [categories, models, vendors, locations, states] = await Promise.all([
      container
        .get<ListAssetCategoriesUseCase>(DI_TOKENS.ListAssetCategoriesUseCase)
        .execute(),
      container
        .get<ListAssetModelsUseCase>(DI_TOKENS.ListAssetModelsUseCase)
        .execute(),
      container.get<ListVendorsUseCase>(DI_TOKENS.ListVendorsUseCase).execute(),
      container
        .get<ListStockLocationsUseCase>(DI_TOKENS.ListStockLocationsUseCase)
        .execute(),
      container
        .get<ListLifecycleStatesUseCase>(DI_TOKENS.ListLifecycleStatesUseCase)
        .execute(),
    ]);

    // Convert to code -> id maps
    const categoryMap: Record<string, string> = {};
    categories.forEach((c) => {
      categoryMap[c.code.toUpperCase()] = c.id;
    });

    const modelMap: Record<string, string> = {};
    models.forEach((m) => {
      modelMap[m.code.toUpperCase()] = m.id;
    });

    const vendorMap: Record<string, string> = {};
    vendors.forEach((v) => {
      vendorMap[v.code.toUpperCase()] = v.id;
    });

    const locationMap: Record<string, string> = {};
    locations.forEach((l) => {
      locationMap[l.code.toUpperCase()] = l.id;
    });

    const stateMap: Record<string, string> = {};
    states.forEach((s) => {
      stateMap[s.code.toUpperCase()] = s.id;
    });

    return {
      success: true,
      data: {
        categoryMap,
        modelMap,
        vendorMap,
        locationMap,
        stateMap,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getImportLookupMapsAction" },
      "Failed to get lookup maps",
    );
  }
}

/**
 * Check for existing assets by serial numbers (for pre-import duplicate detection)
 * Uses serial number as the primary unique field for duplicate detection
 */
export async function checkAssetDuplicatesAction(
  serialNumbers: string[],
): Promise<{
  success: boolean;
  data?: {
    duplicates: Array<{ id: string; serialNumber: string; assetTag: string }>;
    duplicateCount: number;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CREATE);

    const container = getContainer();
    const repository = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );

    // Filter out empty values
    const validSerialNumbers = serialNumbers.filter(
      (s) => s !== null && s !== undefined && s.trim() !== "",
    );

    if (validSerialNumbers.length === 0) {
      return {
        success: true,
        data: { duplicates: [], duplicateCount: 0 },
      };
    }

    // Batch lookup existing assets by serial numbers
    const existingAssets =
      await repository.findBySerialNumbers(validSerialNumbers);

    const duplicates = existingAssets.map((asset) => ({
      id: asset.id,
      serialNumber: asset.serialNumber || "",
      assetTag: asset.assetTag,
    }));

    return {
      success: true,
      data: {
        duplicates,
        duplicateCount: duplicates.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check duplicates",
    };
  }
}

/**
 * Bulk upsert assets (create or update based on duplicate strategy)
 * For "overwrite" strategy: updates existing records, creates new ones
 * For "skip" strategy: skips existing records, creates new ones
 */
export async function bulkUpsertAssetsAction(
  assetsData: Record<string, unknown>[],
  strategy: "skip" | "overwrite" | "fail" | "append",
): Promise<{
  success: boolean;
  data?: {
    createdCount: number;
    updatedCount: number;
    skipCount: number;
    failureCount: number;
    created?: Array<{ assetTag: string; serialNumber?: string }>;
    updated?: Array<{ assetTag: string; serialNumber?: string }>;
    skipped?: Array<{ identifier: string; reason: string }>;
    failures?: Array<{ index: number; identifier: string; error: string }>;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    const repository = container.get<IAssetRepository>(
      DI_TOKENS.IAssetRepository,
    );
    const createUseCase = container.get<CreateAssetUseCase>(
      DI_TOKENS.CreateAssetUseCase,
    );
    const updateUseCase = container.get<UpdateAssetUseCase>(
      DI_TOKENS.UpdateAssetUseCase,
    );

    const log = logger.child({
      controller: "asset.bulkUpsert",
      rows: assetsData.length,
      strategy,
    });
    log.info("Bulk asset upsert started");

    const results = {
      createdCount: 0,
      updatedCount: 0,
      skipCount: 0,
      failureCount: 0,
      created: [] as Array<{ assetTag: string; serialNumber?: string }>,
      updated: [] as Array<{ assetTag: string; serialNumber?: string }>,
      skipped: [] as Array<{ identifier: string; reason: string }>,
      failures: [] as Array<{
        index: number;
        identifier: string;
        error: string;
      }>,
    };

    // Step 1: Collect serial numbers for batch lookup
    const serialNumbers = assetsData
      .map((a) => a.serialNumber as string | undefined)
      .filter((s): s is string => !!s && s.trim() !== "");

    // Step 2: Batch lookup existing assets
    const existingAssets = await repository.findBySerialNumbers(serialNumbers);
    const existingBySerial = new Map(
      existingAssets
        .filter((a) => a.serialNumber)
        .map((a) => [a.serialNumber!, a]),
    );

    // Step 3: Process each record
    for (let i = 0; i < assetsData.length; i++) {
      const assetData = assetsData[i];
      const identifier =
        (assetData.serialNumber as string) ||
        (assetData.assetTag as string) ||
        `Row ${i + 1}`;

      try {
        const validated = CreateAssetSchema.parse(assetData);
        const existingAsset = validated.serialNumber
          ? existingBySerial.get(validated.serialNumber)
          : null;

        if (existingAsset) {
          // Handle duplicate based on strategy
          switch (strategy) {
            case "skip":
              results.skipCount++;
              results.skipped.push({
                identifier,
                reason: `Serial number "${validated.serialNumber}" already exists`,
              });
              break;

            case "overwrite": {
              // Merge/patch: only update non-empty fields from import
              const updateData: Record<string, unknown> = {};
              if (validated.assetCategoryId)
                updateData.assetCategoryId = validated.assetCategoryId;
              if (validated.assetModelId)
                updateData.assetModelId = validated.assetModelId;
              if (validated.vendorId) updateData.vendorId = validated.vendorId;
              if (validated.lifecycleStateId)
                updateData.lifecycleStateId = validated.lifecycleStateId;
              if (validated.purchaseDate)
                updateData.purchaseDate = validated.purchaseDate;
              if (
                validated.purchaseCost !== undefined &&
                validated.purchaseCost !== null
              ) {
                updateData.purchaseCost = validated.purchaseCost;
              }
              if (validated.currency) updateData.currency = validated.currency;
              if (validated.warrantyEndDate)
                updateData.warrantyEndDate = validated.warrantyEndDate;
              if (validated.currentStockLocationId) {
                updateData.currentStockLocationId =
                  validated.currentStockLocationId;
              }
              if (validated.note) updateData.note = validated.note;

              await updateUseCase.execute({
                id: existingAsset.id,
                ...updateData,
              });
              results.updatedCount++;
              results.updated.push({
                assetTag: existingAsset.assetTag,
                serialNumber: validated.serialNumber ?? undefined,
              });
              break;
            }

            case "fail":
              results.failureCount++;
              results.failures.push({
                index: i,
                identifier,
                error: `Duplicate serial number "${validated.serialNumber}" not allowed`,
              });
              break;

            case "append": {
              // Create with modified serial number
              const modifiedSerial = `${validated.serialNumber}-COPY-${Date.now()}`;
              await createUseCase.execute({
                ...validated,
                serialNumber: modifiedSerial,
              });
              results.createdCount++;
              results.created.push({
                assetTag: validated.assetTag ?? "AUTO",
                serialNumber: modifiedSerial,
              });
              break;
            }
          }
        } else {
          // No duplicate - create new record
          const created = await createUseCase.execute({
            assetTag: validated.assetTag,
            assetCategoryId: validated.assetCategoryId,
            assetModelId: validated.assetModelId ?? undefined,
            vendorId: validated.vendorId ?? undefined,
            contractId: validated.contractId ?? undefined,
            lifecycleStateId: validated.lifecycleStateId ?? undefined,
            serialNumber: validated.serialNumber ?? undefined,
            purchaseDate: validated.purchaseDate ?? undefined,
            purchaseCost: validated.purchaseCost ?? undefined,
            currency: validated.currency ?? undefined,
            warrantyEndDate: validated.warrantyEndDate ?? undefined,
            currentStockLocationId:
              validated.currentStockLocationId ?? undefined,
            attributes: validated.attributes ?? undefined,
            note: validated.note ?? undefined,
          });
          results.createdCount++;
          results.created.push({
            assetTag: created.assetTag,
            serialNumber: validated.serialNumber ?? undefined,
          });
        }
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          identifier,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/assets");

    log.info("Bulk asset upsert completed", {
      createdCount: results.createdCount,
      updatedCount: results.updatedCount,
      skipCount: results.skipCount,
      failureCount: results.failureCount,
    });

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to bulk upsert assets",
    };
  }
}
