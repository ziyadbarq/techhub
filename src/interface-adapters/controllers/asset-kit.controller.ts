/**
 * Asset Kit Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateAssetKitDTO,
  UpdateAssetKitDTO,
  type AssetKitDTO,
} from "../dtos/generated/asset-kit.dto";
import { AssetKitPresenter } from "../presenters/asset-kit.presenter";
import type {
  CreateAssetKitUseCase,
  GetAssetKitUseCase,
  ListAssetKitsUseCase,
  UpdateAssetKitUseCase,
  DeleteAssetKitUseCase,
} from "@/core/use-cases/asset-kits";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// ==================== Asset Kit Management ====================

export async function createAssetKitAction(
  data: z.infer<typeof CreateAssetKitDTO>,
): Promise<ActionResponse<AssetKitDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CREATE);

    const validated = CreateAssetKitDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateAssetKitUseCase>(
      DI_TOKENS.CreateAssetKitUseCase,
    );

    const kit = await useCase.execute({
      name: validated.name,
      code: validated.code,
      description: validated.description,
      kitType: validated.kitType,
      isActive: validated.isActive,
    });

    revalidatePath("/asset-kits");

    return {
      success: true,
      data: AssetKitPresenter.toDTO(kit),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createAssetKitAction" },
      "Failed to create asset kit",
    );
  }
}

export async function listAssetKitsAction(): Promise<
  ActionResponse<AssetKitDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAssetKitsUseCase>(
      DI_TOKENS.ListAssetKitsUseCase,
    );

    const result = await useCase.execute({});

    return {
      success: true,
      data: AssetKitPresenter.toDTOList(result.kits),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAssetKitsAction" },
      "Failed to list asset kits",
    );
  }
}

export async function getAssetKitAction(
  id: string,
): Promise<ActionResponse<AssetKitDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetAssetKitUseCase>(
      DI_TOKENS.GetAssetKitUseCase,
    );

    const kit = await useCase.execute({ kitId: id });

    return {
      success: true,
      data: AssetKitPresenter.toDTO(kit),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetKitAction", id },
      "Failed to get asset kit",
    );
  }
}

export async function updateAssetKitAction(
  id: string,
  data: z.infer<typeof UpdateAssetKitDTO>,
): Promise<ActionResponse<AssetKitDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_UPDATE);

    const validated = UpdateAssetKitDTO.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateAssetKitUseCase>(
      DI_TOKENS.UpdateAssetKitUseCase,
    );

    const kit = await useCase.execute({
      kitId: id,
      name: validated.name,
      code: validated.code,
      description: validated.description,
      kitType: validated.kitType,
      isActive: validated.isActive,
    });

    revalidatePath("/asset-kits");
    revalidatePath(`/asset-kits/${id}`);

    return {
      success: true,
      data: AssetKitPresenter.toDTO(kit),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateAssetKitAction", id },
      "Failed to update asset kit",
    );
  }
}

export async function deleteAssetKitAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteAssetKitUseCase>(
      DI_TOKENS.DeleteAssetKitUseCase,
    );

    await useCase.execute({ kitId: id });

    revalidatePath("/asset-kits");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteAssetKitAction", id },
      "Failed to delete asset kit",
    );
  }
}
