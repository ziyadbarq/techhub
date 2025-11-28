/**
 * AssetModel Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateAssetModelSchema,
  UpdateAssetModelSchema,
  AssetModelIdSchema,
  type CreateAssetModelDTO,
  type UpdateAssetModelDTO,
} from "../dtos/generated/asset-model.dto";
import {
  presentAssetModel,
  presentAssetModels,
  type AssetModelDTO,
  type AssetModelEnrichment,
} from "../presenters/asset-model.presenter";
import type {
  CreateAssetModelUseCase,
  ListAssetModelsUseCase,
  GetAssetModelUseCase,
  UpdateAssetModelUseCase,
  DeleteAssetModelUseCase,
} from "@/core/use-cases/asset/asset-model";
import type { ListAssetCategoriesUseCase } from "@/core/use-cases/asset/asset-category";
import type { ListVendorsUseCase } from "@/core/use-cases/foundation/vendor";
import type { AssetModel } from "@/core/domain/entities/asset-model.entity";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Enrich asset models with related entity display data
 */
async function enrichAssetModels(
  assetModels: AssetModel[],
): Promise<Map<string, AssetModelEnrichment>> {
  if (assetModels.length === 0) {
    return new Map();
  }

  const container = getContainer();

  // Collect unique IDs
  const categoryIds = [...new Set(assetModels.map((m) => m.assetCategoryId))];
  const vendorIds = [
    ...new Set(assetModels.map((m) => m.vendorId).filter(Boolean)),
  ] as string[];

  // Fetch related entities in parallel
  const [categoriesMap, vendorsMap] = await Promise.all([
    (async () => {
      if (categoryIds.length === 0) return new Map<string, string>();

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
      if (vendorIds.length === 0) return new Map<string, string>();

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
  ]);

  // Build enrichment map
  const enrichmentMap = new Map<string, AssetModelEnrichment>();
  for (const model of assetModels) {
    enrichmentMap.set(model.id, {
      categoryName: categoriesMap.get(model.assetCategoryId) || null,
      vendorName: model.vendorId
        ? vendorsMap.get(model.vendorId) || null
        : null,
    });
  }

  return enrichmentMap;
}

export async function createAssetModelAction(
  data: CreateAssetModelDTO,
): Promise<ActionResponse<AssetModelDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_CREATE);

    const validated = CreateAssetModelSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateAssetModelUseCase>(
      DI_TOKENS.CreateAssetModelUseCase,
    );

    const assetModel = await useCase.execute({
      name: validated.name,
      code: validated.code,
      description: validated.description ?? undefined,
      assetCategoryId: validated.assetCategoryId,
      vendorId: validated.vendorId,
      defaultWarrantyMonths: validated.defaultWarrantyMonths ?? undefined,
      defaultAttributes: validated.defaultAttributes ?? undefined,
    });

    revalidatePath("/asset-models");

    return {
      success: true,
      data: presentAssetModel(assetModel),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createAssetModelAction" },
      "Failed to create asset model",
    );
  }
}

export async function listAssetModelsAction(): Promise<
  ActionResponse<AssetModelDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAssetModelsUseCase>(
      DI_TOKENS.ListAssetModelsUseCase,
    );

    const assetModels = await useCase.execute();

    // Enrich with related entity names
    const enrichmentMap = await enrichAssetModels(assetModels);

    return {
      success: true,
      data: presentAssetModels(assetModels, enrichmentMap),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAssetModelsAction" },
      "Failed to list asset models",
    );
  }
}

export async function listAssetModelsByCategoryAction(
  assetCategoryId: string,
): Promise<ActionResponse<AssetModelDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAssetModelsUseCase>(
      DI_TOKENS.ListAssetModelsUseCase,
    );

    const assetModels = await useCase.execute({ assetCategoryId });

    // Enrich with related entity names
    const enrichmentMap = await enrichAssetModels(assetModels);

    return {
      success: true,
      data: presentAssetModels(assetModels, enrichmentMap),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAssetModelsByCategoryAction", assetCategoryId },
      "Failed to list asset models by category",
    );
  }
}

export async function getAssetModelAction(
  id: string,
): Promise<ActionResponse<AssetModelDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_VIEW);

    const validated = AssetModelIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetAssetModelUseCase>(
      DI_TOKENS.GetAssetModelUseCase,
    );

    const assetModel = await useCase.execute(validated.id);

    if (!assetModel) {
      return {
        success: false,
        error: "Asset model not found",
      };
    }

    return {
      success: true,
      data: presentAssetModel(assetModel),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetModelAction", id },
      "Failed to get asset model",
    );
  }
}

export async function updateAssetModelAction(
  id: string,
  data: UpdateAssetModelDTO,
): Promise<ActionResponse<AssetModelDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_UPDATE);

    const validatedId = AssetModelIdSchema.parse({ id });
    const validated = UpdateAssetModelSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateAssetModelUseCase>(
      DI_TOKENS.UpdateAssetModelUseCase,
    );

    const assetModel = await useCase.execute({
      id: validatedId.id,
      name: validated.name,
      code: validated.code,
      description: validated.description,
      assetCategoryId: validated.assetCategoryId,
      vendorId: validated.vendorId,
      defaultWarrantyMonths: validated.defaultWarrantyMonths,
      defaultAttributes: validated.defaultAttributes,
    });

    revalidatePath("/asset-models");
    revalidatePath(`/asset-models/${id}`);

    return {
      success: true,
      data: presentAssetModel(assetModel),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateAssetModelAction", id },
      "Failed to update asset model",
    );
  }
}

export async function deleteAssetModelAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_DELETE);

    const validated = AssetModelIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteAssetModelUseCase>(
      DI_TOKENS.DeleteAssetModelUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/asset-models");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteAssetModelAction", id },
      "Failed to delete asset model",
    );
  }
}

export async function bulkCreateAssetModelsAction(
  itemsData: CreateAssetModelDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; code: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateAssetModelUseCase>(
      DI_TOKENS.CreateAssetModelUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; code: string; error: string }>,
    };

    // Process asset models sequentially to avoid overwhelming the database
    for (let i = 0; i < itemsData.length; i++) {
      const itemData = itemsData[i];
      try {
        const validated = CreateAssetModelSchema.parse(itemData);

        await useCase.execute({
          name: validated.name,
          code: validated.code,
          description: validated.description ?? undefined,
          assetCategoryId: validated.assetCategoryId,
          vendorId: validated.vendorId,
          defaultWarrantyMonths: validated.defaultWarrantyMonths ?? undefined,
          defaultAttributes: validated.defaultAttributes ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          code: itemData.code || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/asset-models");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateAssetModelsAction" },
      "Failed to bulk create asset models",
    );
  }
}

/**
 * Check for existing asset models by code (batch lookup for duplicate detection)
 */
export async function checkAssetModelDuplicatesAction(
  codes: string[],
): Promise<{
  success: boolean;
  data?: {
    duplicates: Array<{ id: string; code: string; name: string }>;
    duplicateCount: number;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_CREATE);

    const container = getContainer();
    const repository = container.get<IAssetModelRepository>(
      DI_TOKENS.IAssetModelRepository,
    );

    const validCodes = codes.filter(
      (c) => c !== null && c !== undefined && c.trim() !== "",
    );

    if (validCodes.length === 0) {
      return { success: true, data: { duplicates: [], duplicateCount: 0 } };
    }

    const existingModels = await repository.findByCodes(validCodes);

    const duplicates = existingModels.map((model) => ({
      id: model.id,
      code: model.code,
      name: model.name,
    }));

    return {
      success: true,
      data: { duplicates, duplicateCount: duplicates.length },
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
 * Bulk upsert asset models (create or update based on duplicate strategy)
 */
export async function bulkUpsertAssetModelsAction(
  modelsData: Record<string, unknown>[],
  strategy: "skip" | "overwrite" | "fail" | "append",
): Promise<{
  success: boolean;
  data?: {
    createdCount: number;
    updatedCount: number;
    skipCount: number;
    failureCount: number;
    created?: Array<{ code: string; name: string }>;
    updated?: Array<{ code: string; name: string }>;
    skipped?: Array<{ identifier: string; reason: string }>;
    failures?: Array<{ index: number; identifier: string; error: string }>;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.ASSET_MODELS_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    const repository = container.get<IAssetModelRepository>(
      DI_TOKENS.IAssetModelRepository,
    );
    const createUseCase = container.get<CreateAssetModelUseCase>(
      DI_TOKENS.CreateAssetModelUseCase,
    );
    const updateUseCase = container.get<UpdateAssetModelUseCase>(
      DI_TOKENS.UpdateAssetModelUseCase,
    );

    const log = logger.child({
      controller: "assetModel.bulkUpsert",
      rows: modelsData.length,
      strategy,
    });
    log.info("Bulk asset model upsert started");

    const results = {
      createdCount: 0,
      updatedCount: 0,
      skipCount: 0,
      failureCount: 0,
      created: [] as Array<{ code: string; name: string }>,
      updated: [] as Array<{ code: string; name: string }>,
      skipped: [] as Array<{ identifier: string; reason: string }>,
      failures: [] as Array<{
        index: number;
        identifier: string;
        error: string;
      }>,
    };

    const codes = modelsData
      .map((m) => m.code as string | undefined)
      .filter((c): c is string => !!c && c.trim() !== "");

    const existingModels = await repository.findByCodes(codes);
    const existingByCode = new Map(
      existingModels.map((m) => [m.code.toUpperCase(), m]),
    );

    for (let i = 0; i < modelsData.length; i++) {
      const modelData = modelsData[i];
      const identifier =
        (modelData.code as string) ||
        (modelData.name as string) ||
        `Row ${i + 1}`;

      try {
        const validated = CreateAssetModelSchema.parse(modelData);
        const existingModel = validated.code
          ? existingByCode.get(validated.code.toUpperCase())
          : null;

        if (existingModel) {
          switch (strategy) {
            case "skip":
              results.skipCount++;
              results.skipped.push({
                identifier,
                reason: `Code "${validated.code}" already exists`,
              });
              break;
            case "overwrite": {
              await updateUseCase.execute({
                id: existingModel.id,
                name: validated.name || undefined,
                description: validated.description ?? undefined,
                assetCategoryId: validated.assetCategoryId || undefined,
                vendorId: validated.vendorId ?? undefined,
                defaultWarrantyMonths:
                  validated.defaultWarrantyMonths ?? undefined,
                defaultAttributes: validated.defaultAttributes ?? undefined,
              });
              results.updatedCount++;
              results.updated.push({
                code: existingModel.code,
                name: validated.name,
              });
              break;
            }
            case "fail":
              results.failureCount++;
              results.failures.push({
                index: i,
                identifier,
                error: `Duplicate code "${validated.code}" not allowed`,
              });
              break;
            case "append": {
              const modifiedCode = `${validated.code}-COPY-${Date.now()}`;
              await createUseCase.execute({
                name: validated.name,
                code: modifiedCode,
                description: validated.description ?? undefined,
                assetCategoryId: validated.assetCategoryId,
                vendorId: validated.vendorId ?? undefined,
                defaultWarrantyMonths:
                  validated.defaultWarrantyMonths ?? undefined,
                defaultAttributes: validated.defaultAttributes ?? undefined,
              });
              results.createdCount++;
              results.created.push({
                code: modifiedCode,
                name: validated.name,
              });
              break;
            }
          }
        } else {
          await createUseCase.execute({
            name: validated.name,
            code: validated.code,
            description: validated.description ?? undefined,
            assetCategoryId: validated.assetCategoryId,
            vendorId: validated.vendorId ?? undefined,
            defaultWarrantyMonths: validated.defaultWarrantyMonths ?? undefined,
            defaultAttributes: validated.defaultAttributes ?? undefined,
          });
          results.createdCount++;
          results.created.push({
            code: validated.code || "AUTO",
            name: validated.name,
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

    revalidatePath("/asset-models");
    log.info("Bulk asset model upsert completed", results);

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk upsert asset models",
    };
  }
}
