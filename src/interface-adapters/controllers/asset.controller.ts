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
  AssetIdSchema,
  AssetSearchSchema,
  type CreateAssetDTO,
  type UpdateAssetDTO,
  type AssetSearchDTO,
} from "../dtos/generated/asset.dto";
import {
  presentAsset,
  presentAssets,
  type AssetDTO,
} from "../presenters/asset.presenter";
import type {
  CreateAssetUseCase,
  ListAssetsUseCase,
  GetAssetUseCase,
  UpdateAssetUseCase,
  DeleteAssetUseCase,
} from "@/core/use-cases/asset/asset";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

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

    return {
      success: true,
      data: presentAssets(assets),
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
  id: string,
): Promise<ActionResponse<AssetDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const validated = AssetIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetAssetUseCase>(DI_TOKENS.GetAssetUseCase);

    const asset = await useCase.execute(validated.id);

    if (!asset) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    return {
      success: true,
      data: presentAsset(asset),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetAction", id },
      "Failed to get asset",
    );
  }
}

export async function updateAssetAction(
  id: string,
  data: UpdateAssetDTO,
): Promise<ActionResponse<AssetDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validatedId = AssetIdSchema.parse({ id });
    const validated = UpdateAssetSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateAssetUseCase>(
      DI_TOKENS.UpdateAssetUseCase,
    );

    const asset = await useCase.execute({
      id: validatedId.id,
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
    revalidatePath(`/assets/${id}`);

    return {
      success: true,
      data: presentAsset(asset),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateAssetAction", id },
      "Failed to update asset",
    );
  }
}

export async function deleteAssetAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const validated = AssetIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteAssetUseCase>(
      DI_TOKENS.DeleteAssetUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/assets");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteAssetAction", id },
      "Failed to delete asset",
    );
  }
}
