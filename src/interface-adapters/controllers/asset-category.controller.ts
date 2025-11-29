/**
 * AssetCategory Controller
 * Server actions for AssetCategory CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateAssetCategorySchema,
  UpdateAssetCategorySchema,
  AssetCategoryIdSchema,
  type CreateAssetCategoryDTO,
  type UpdateAssetCategoryDTO,
} from "../dtos/generated/asset-category.dto";
import {
  presentAssetCategory,
  presentAssetCategories,
  type AssetCategoryDTO,
} from "../presenters/asset-category.presenter";
import type {
  CreateAssetCategoryUseCase,
  ListAssetCategoriesUseCase,
  GetAssetCategoryUseCase,
  UpdateAssetCategoryUseCase,
  DeleteAssetCategoryUseCase,
} from "@/core/use-cases/asset/asset-category";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createAssetCategoryAction(
  data: CreateAssetCategoryDTO,
): Promise<ActionResponse<AssetCategoryDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORIES_CREATE);

    const validated = CreateAssetCategorySchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateAssetCategoryUseCase>(
      DI_TOKENS.CreateAssetCategoryUseCase,
    );

    const assetCategory = await useCase.execute({
      name: validated.name,
      code: validated.code,
      description: validated.description ?? undefined,
      lifecycleModelId: validated.lifecycleModelId ?? undefined,
    });

    revalidatePath("/asset-categories");

    return {
      success: true,
      data: presentAssetCategory(assetCategory),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createAssetCategoryAction" },
      "Failed to create asset category",
    );
  }
}

export async function listAssetCategoriesAction(): Promise<
  ActionResponse<AssetCategoryDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORIES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAssetCategoriesUseCase>(
      DI_TOKENS.ListAssetCategoriesUseCase,
    );

    const assetCategories = await useCase.execute();

    return {
      success: true,
      data: presentAssetCategories(assetCategories),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAssetCategoriesAction" },
      "Failed to list asset categories",
    );
  }
}

export async function getAssetCategoryAction(
  id: string,
): Promise<ActionResponse<AssetCategoryDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORIES_VIEW);

    const validated = AssetCategoryIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetAssetCategoryUseCase>(
      DI_TOKENS.GetAssetCategoryUseCase,
    );

    const assetCategory = await useCase.execute(validated.id);

    if (!assetCategory) {
      return {
        success: false,
        error: "Asset category not found",
      };
    }

    return {
      success: true,
      data: presentAssetCategory(assetCategory),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetCategoryAction", id },
      "Failed to get asset category",
    );
  }
}

export async function updateAssetCategoryAction(
  id: string,
  data: UpdateAssetCategoryDTO,
): Promise<ActionResponse<AssetCategoryDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORIES_UPDATE);

    const validatedId = AssetCategoryIdSchema.parse({ id });
    const validated = UpdateAssetCategorySchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateAssetCategoryUseCase>(
      DI_TOKENS.UpdateAssetCategoryUseCase,
    );

    const assetCategory = await useCase.execute({
      id: validatedId.id,
      name: validated.name,
      code: validated.code,
      description: validated.description,
      lifecycleModelId: validated.lifecycleModelId,
    });

    revalidatePath("/asset-categories");
    revalidatePath(`/asset-categories/${id}`);

    return {
      success: true,
      data: presentAssetCategory(assetCategory),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateAssetCategoryAction", id },
      "Failed to update asset category",
    );
  }
}

export async function deleteAssetCategoryAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORIES_DELETE);

    const validated = AssetCategoryIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteAssetCategoryUseCase>(
      DI_TOKENS.DeleteAssetCategoryUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/asset-categories");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteAssetCategoryAction", id },
      "Failed to delete asset category",
    );
  }
}

export async function bulkCreateAssetCategoriesAction(
  categoriesData: CreateAssetCategoryDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; code: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORIES_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateAssetCategoryUseCase>(
      DI_TOKENS.CreateAssetCategoryUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; code: string; error: string }>,
    };

    // Process asset categories sequentially to avoid overwhelming the database
    for (let i = 0; i < categoriesData.length; i++) {
      const categoryData = categoriesData[i];
      try {
        const validated = CreateAssetCategorySchema.parse(categoryData);

        await useCase.execute({
          name: validated.name,
          code: validated.code,
          description: validated.description ?? undefined,
          lifecycleModelId: validated.lifecycleModelId ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          code: categoryData.code || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/asset-categories");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreateAssetCategoriesAction" },
      "Failed to bulk create asset categories",
    );
  }
}

/**
 * Check for existing asset categories by code (batch lookup for duplicate detection)
 */
export async function checkAssetCategoryDuplicatesAction(
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
    await requirePermission(PERMISSIONS.ASSET_CATEGORIES_CREATE);

    const container = getContainer();
    const repository = container.get<IAssetCategoryRepository>(
      DI_TOKENS.IAssetCategoryRepository,
    );

    const validCodes = codes.filter(
      (c) => c !== null && c !== undefined && c.trim() !== "",
    );

    if (validCodes.length === 0) {
      return { success: true, data: { duplicates: [], duplicateCount: 0 } };
    }

    const existingCategories = await repository.findByCodes(validCodes);

    const duplicates = existingCategories.map((category) => ({
      id: category.id,
      code: category.code,
      name: category.name,
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
 * Bulk upsert asset categories (create or update based on duplicate strategy)
 */
export async function bulkUpsertAssetCategoriesAction(
  categoriesData: Record<string, unknown>[],
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
    await requirePermission(PERMISSIONS.ASSET_CATEGORIES_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    const repository = container.get<IAssetCategoryRepository>(
      DI_TOKENS.IAssetCategoryRepository,
    );
    const createUseCase = container.get<CreateAssetCategoryUseCase>(
      DI_TOKENS.CreateAssetCategoryUseCase,
    );
    const updateUseCase = container.get<UpdateAssetCategoryUseCase>(
      DI_TOKENS.UpdateAssetCategoryUseCase,
    );

    const log = logger.child({
      controller: "assetCategory.bulkUpsert",
      rows: categoriesData.length,
      strategy,
    });
    log.info("Bulk asset category upsert started");

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

    const codes = categoriesData
      .map((c) => c.code as string | undefined)
      .filter((c): c is string => !!c && c.trim() !== "");

    const existingCategories = await repository.findByCodes(codes);
    const existingByCode = new Map(
      existingCategories.map((c) => [c.code.toUpperCase(), c]),
    );

    for (let i = 0; i < categoriesData.length; i++) {
      const categoryData = categoriesData[i];
      const identifier =
        (categoryData.code as string) ||
        (categoryData.name as string) ||
        `Row ${i + 1}`;

      try {
        const validated = CreateAssetCategorySchema.parse(categoryData);
        const existingCategory = validated.code
          ? existingByCode.get(validated.code.toUpperCase())
          : null;

        if (existingCategory) {
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
                id: existingCategory.id,
                name: validated.name || undefined,
                description: validated.description ?? undefined,
                lifecycleModelId: validated.lifecycleModelId ?? undefined,
              });
              results.updatedCount++;
              results.updated.push({
                code: existingCategory.code,
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
                lifecycleModelId: validated.lifecycleModelId ?? undefined,
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
            lifecycleModelId: validated.lifecycleModelId ?? undefined,
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

    revalidatePath("/asset-categories");
    log.info("Bulk asset category upsert completed", results);

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk upsert asset categories",
    };
  }
}
