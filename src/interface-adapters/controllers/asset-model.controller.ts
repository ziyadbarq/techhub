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
} from "../presenters/asset-model.presenter";
import type {
  CreateAssetModelUseCase,
  ListAssetModelsUseCase,
  GetAssetModelUseCase,
  UpdateAssetModelUseCase,
  DeleteAssetModelUseCase,
} from "@/core/use-cases/asset/asset-model";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

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

    return {
      success: true,
      data: presentAssetModels(assetModels),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAssetModelsAction" },
      "Failed to list asset models",
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
