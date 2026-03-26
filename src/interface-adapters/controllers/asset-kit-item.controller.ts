/**
 * Asset Kit Item Controller
 *
 * Server actions for Asset Kit Item Management
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  AddKitItemDTO,
  UpdateKitItemDTO,
  type AssetKitItemDTO,
} from "../dtos/generated/asset-kit.dto";
import { AssetKitItemPresenter } from "../presenters/asset-kit.presenter";
import type {
  AddKitItemUseCase,
  RemoveKitItemUseCase,
  UpdateKitItemUseCase,
} from "@/core/use-cases/asset-kits";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// ==================== Kit Item Management ====================

export async function addKitItemAction(
  data: z.infer<typeof AddKitItemDTO>,
): Promise<ActionResponse<AssetKitItemDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validated = AddKitItemDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<AddKitItemUseCase>(
      DI_TOKENS.AddKitItemUseCase,
    );

    const item = await useCase.execute({
      kitId: validated.kitId,
      assetCategoryId: validated.assetCategoryId,
      quantity: validated.quantity,
      isRequired: validated.isRequired,
      note: validated.note,
    });

    revalidatePath("/asset-kits");
    revalidatePath(`/asset-kits/${validated.kitId}`);

    return {
      success: true,
      data: AssetKitItemPresenter.toDTO(item),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "addKitItemAction" },
      "Failed to add kit item",
    );
  }
}

export async function updateKitItemAction(
  itemId: string,
  data: z.infer<typeof UpdateKitItemDTO>,
): Promise<ActionResponse<AssetKitItemDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validated = UpdateKitItemDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateKitItemUseCase>(
      DI_TOKENS.UpdateKitItemUseCase,
    );

    const item = await useCase.execute({
      itemId,
      quantity: validated.quantity,
      isRequired: validated.isRequired,
      note: validated.note,
    });

    revalidatePath("/asset-kits");

    return {
      success: true,
      data: AssetKitItemPresenter.toDTO(item),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateKitItemAction", itemId },
      "Failed to update kit item",
    );
  }
}

export async function removeKitItemAction(
  itemId: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const container = getContainer();
    const useCase = container.get<RemoveKitItemUseCase>(
      DI_TOKENS.RemoveKitItemUseCase,
    );

    await useCase.execute({ itemId });

    revalidatePath("/asset-kits");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "removeKitItemAction", itemId },
      "Failed to remove kit item",
    );
  }
}
