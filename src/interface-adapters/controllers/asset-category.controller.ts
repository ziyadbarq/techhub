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
      isConsumable: validated.isConsumable ?? undefined,
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
      isConsumable: validated.isConsumable,
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
