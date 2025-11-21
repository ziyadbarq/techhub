/**
 * StockMovement Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateStockMovementSchema,
  StockMovementIdSchema,
  ListStockMovementsSchema,
  type CreateStockMovementDTO,
  type ListStockMovementsDTO,
} from "../dtos/generated/stock-movement.dto";
import {
  presentStockMovement,
  presentStockMovements,
  type StockMovementDTO,
} from "../presenters/stock-movement.presenter";
import type {
  CreateStockMovementUseCase,
  ListStockMovementsUseCase,
  GetStockMovementUseCase,
  DeleteStockMovementUseCase,
} from "@/core/use-cases/inventory/stock-movement";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createStockMovementAction(
  data: CreateStockMovementDTO,
): Promise<ActionResponse<StockMovementDTO>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_CREATE);

    const validated = CreateStockMovementSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateStockMovementUseCase>(
      DI_TOKENS.CreateStockMovementUseCase,
    );

    const movement = await useCase.execute({
      movementType: validated.movementType,
      stockLocationFromId: validated.stockLocationFromId ?? undefined,
      stockLocationToId: validated.stockLocationToId ?? undefined,
      assetId: validated.assetId ?? undefined,
      quantity: validated.quantity,
      reason: validated.reason ?? undefined,
      performedById: validated.performedById,
      occurredAt: validated.occurredAt,
    });

    revalidatePath("/stock-movements");
    if (validated.assetId) {
      revalidatePath(`/assets/${validated.assetId}`);
    }

    return {
      success: true,
      data: presentStockMovement(movement),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createStockMovementAction" },
      "Failed to create stock movement",
    );
  }
}

export async function listStockMovementsAction(
  options?: ListStockMovementsDTO,
): Promise<ActionResponse<StockMovementDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_VIEW);

    const validated = options
      ? ListStockMovementsSchema.parse(options)
      : undefined;

    const container = getContainer();
    const useCase = container.get<ListStockMovementsUseCase>(
      DI_TOKENS.ListStockMovementsUseCase,
    );

    const movements = await useCase.execute(validated);

    return {
      success: true,
      data: presentStockMovements(movements),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listStockMovementsAction" },
      "Failed to list stock movements",
    );
  }
}

export async function getStockMovementAction(
  id: string,
): Promise<ActionResponse<StockMovementDTO>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_VIEW);

    const validated = StockMovementIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetStockMovementUseCase>(
      DI_TOKENS.GetStockMovementUseCase,
    );

    const movement = await useCase.execute(validated.id);

    if (!movement) {
      return {
        success: false,
        error: "Stock movement not found",
      };
    }

    return {
      success: true,
      data: presentStockMovement(movement),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getStockMovementAction", id },
      "Failed to get stock movement",
    );
  }
}

export async function deleteStockMovementAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_DELETE);

    const validated = StockMovementIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteStockMovementUseCase>(
      DI_TOKENS.DeleteStockMovementUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/stock-movements");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteStockMovementAction", id },
      "Failed to delete stock movement",
    );
  }
}
