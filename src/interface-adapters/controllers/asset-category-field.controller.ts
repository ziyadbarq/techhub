/**
 * Asset Category Field Controller
 * Server actions for asset category field operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ActionResponse } from "./types";
import {
  CreateAssetCategoryFieldSchema,
  UpdateAssetCategoryFieldSchema,
  type CreateAssetCategoryFieldDTO,
  type UpdateAssetCategoryFieldDTO,
} from "@/interface-adapters/dtos/generated/asset-category-field.dto";
import {
  AssetCategoryFieldPresenter,
  type AssetCategoryFieldDTO,
  type EnrichedAssetCategoryFieldDTO,
  type AssetCategoryFieldWithDefinition,
} from "@/interface-adapters/presenters/asset-category-field.presenter";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import type {
  CreateAssetCategoryFieldUseCase,
  GetAssetCategoryFieldUseCase,
  ListAssetCategoryFieldsUseCase,
  UpdateAssetCategoryFieldUseCase,
  DeleteAssetCategoryFieldUseCase,
} from "@/core/use-cases/asset-category-field";

/**
 * Create a new asset category field
 */
export async function createAssetCategoryFieldAction(
  data: CreateAssetCategoryFieldDTO,
): Promise<ActionResponse<AssetCategoryFieldDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_CREATE);

    const validated = CreateAssetCategoryFieldSchema.parse(data);
    const container = getContainer();
    const useCase = container.get<CreateAssetCategoryFieldUseCase>(
      DI_TOKENS.CreateAssetCategoryFieldUseCase,
    );

    const field = await useCase.execute(validated);

    revalidatePath("/asset-categories");
    revalidatePath("/asset-category-fields");

    return {
      success: true,
      data: AssetCategoryFieldPresenter.toDTO(field),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create asset category field",
    };
  }
}

/**
 * Get an asset category field by ID
 */
export async function getAssetCategoryFieldAction(
  id: string,
): Promise<ActionResponse<AssetCategoryFieldDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetAssetCategoryFieldUseCase>(
      DI_TOKENS.GetAssetCategoryFieldUseCase,
    );

    const field = await useCase.execute({ id });

    return {
      success: true,
      data: AssetCategoryFieldPresenter.toDTO(field),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get asset category field",
    };
  }
}

/**
 * List asset category fields with optional filters
 */
export async function listAssetCategoryFieldsAction(params?: {
  assetCategoryId?: string;
  fieldDefinitionId?: string;
}): Promise<ActionResponse<AssetCategoryFieldDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAssetCategoryFieldsUseCase>(
      DI_TOKENS.ListAssetCategoryFieldsUseCase,
    );

    const fields = await useCase.execute(params ?? {});

    return {
      success: true,
      data: AssetCategoryFieldPresenter.toDTOList(fields),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list asset category fields",
    };
  }
}

/**
 * Update an asset category field
 */
export async function updateAssetCategoryFieldAction(
  id: string,
  data: UpdateAssetCategoryFieldDTO,
): Promise<ActionResponse<AssetCategoryFieldDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_UPDATE);

    const validated = UpdateAssetCategoryFieldSchema.parse(data);
    const container = getContainer();
    const useCase = container.get<UpdateAssetCategoryFieldUseCase>(
      DI_TOKENS.UpdateAssetCategoryFieldUseCase,
    );

    const field = await useCase.execute({
      id,
      ...validated,
    });

    revalidatePath("/asset-categories");
    revalidatePath("/asset-category-fields");

    return {
      success: true,
      data: AssetCategoryFieldPresenter.toDTO(field),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update asset category field",
    };
  }
}

/**
 * Delete an asset category field
 */
export async function deleteAssetCategoryFieldAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteAssetCategoryFieldUseCase>(
      DI_TOKENS.DeleteAssetCategoryFieldUseCase,
    );

    await useCase.execute({ id });

    revalidatePath("/asset-categories");
    revalidatePath("/asset-category-fields");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete asset category field",
    };
  }
}

/**
 * List asset category fields with FieldDefinition details for a specific category
 * Returns enriched DTOs with field name, label, dataType, etc.
 */
export async function listEnrichedAssetCategoryFieldsAction(
  assetCategoryId: string,
): Promise<ActionResponse<EnrichedAssetCategoryFieldDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_VIEW);

    const container = getContainer();
    const repository = container.get<IAssetCategoryFieldRepository>(
      DI_TOKENS.IAssetCategoryFieldRepository,
    );

    const fields =
      await repository.findByAssetCategoryIdWithDefinition(assetCategoryId);

    // Transform to enriched DTOs - the presenter handles type casting
    const enrichedFields = AssetCategoryFieldPresenter.toEnrichedDTOList(
      fields as AssetCategoryFieldWithDefinition[],
    );

    return {
      success: true,
      data: enrichedFields,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list enriched asset category fields",
    };
  }
}
