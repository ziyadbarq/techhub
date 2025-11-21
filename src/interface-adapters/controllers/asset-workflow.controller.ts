/**
 * Asset Workflow Controller
 * Guided workflows that perform multiple operations atomically
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { getCurrentUserId } from "@/lib/auth/session";
import type {
  CreateAssetAssignmentUseCase,
  UpdateAssetAssignmentUseCase,
} from "@/core/use-cases/asset/asset-assignment";
import type { CreateStockMovementUseCase } from "@/core/use-cases/inventory/stock-movement";
import type { UpdateAssetUseCase } from "@/core/use-cases/asset/asset";
import {
  presentAssetAssignment,
  type AssetAssignmentDTO,
} from "../presenters/asset-assignment.presenter";
import {
  presentStockMovement,
  type StockMovementDTO,
} from "../presenters/stock-movement.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Assign Asset to Employee Workflow
 * 1. Creates assignment (PERSON type)
 * 2. Creates stock movement OUT
 * 3. Updates asset location to null (with employee)
 */
export async function assignAssetToEmployeeAction(data: {
  assetId: string;
  personId: string;
  stockLocationFromId: string | null;
  note?: string;
}): Promise<
  ActionResponse<{ assignment: AssetAssignmentDTO; movement: StockMovementDTO }>
> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_CREATE);
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_CREATE);

    // Get current user from session for performedById
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const container = getContainer();
    const now = new Date();

    // 1. Create assignment
    const createAssignmentUseCase = container.get<CreateAssetAssignmentUseCase>(
      DI_TOKENS.CreateAssetAssignmentUseCase,
    );
    const assignment = await createAssignmentUseCase.execute({
      assetId: data.assetId,
      assigneeType: "PERSON",
      assigneeId: data.personId,
      startDate: now,
      isPrimary: true,
      note: data.note,
    });

    // 2. Create stock movement OUT
    const createMovementUseCase = container.get<CreateStockMovementUseCase>(
      DI_TOKENS.CreateStockMovementUseCase,
    );
    const movement = await createMovementUseCase.execute({
      movementType: "OUT",
      stockLocationFromId: data.stockLocationFromId,
      assetId: data.assetId,
      quantity: 1,
      reason: `Assigned to employee`,
      performedById: currentUserId, // Use current user from session
      occurredAt: now,
    });

    // 3. Update asset location (set to null since assigned to person)
    const updateAssetUseCase = container.get<UpdateAssetUseCase>(
      DI_TOKENS.UpdateAssetUseCase,
    );
    await updateAssetUseCase.execute({
      id: data.assetId,
      currentStockLocationId: null,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${data.assetId}`);
    revalidatePath("/asset-assignments");

    return {
      success: true,
      data: {
        assignment: presentAssetAssignment(assignment),
        movement: presentStockMovement(movement),
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "assignAssetToEmployeeAction" },
      "Failed to assign asset to employee",
    );
  }
}

/**
 * Return Asset to Inventory Workflow
 * 1. Ends assignment
 * 2. Creates stock movement IN
 * 3. Updates asset location
 */
export async function returnAssetAction(data: {
  assetId: string;
  assignmentId: string;
  stockLocationToId: string;
  note?: string;
}): Promise<ActionResponse<{ movement: StockMovementDTO }>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE);
    await requirePermission(PERMISSIONS.STOCK_MOVEMENTS_CREATE);

    // Get current user from session for performedById
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const container = getContainer();
    const now = new Date();

    // 1. End assignment
    const updateAssignmentUseCase = container.get<UpdateAssetAssignmentUseCase>(
      DI_TOKENS.UpdateAssetAssignmentUseCase,
    );
    await updateAssignmentUseCase.execute({
      id: data.assignmentId,
      endDate: now,
    });

    // 2. Create stock movement IN
    const createMovementUseCase = container.get<CreateStockMovementUseCase>(
      DI_TOKENS.CreateStockMovementUseCase,
    );
    const movement = await createMovementUseCase.execute({
      movementType: "IN",
      stockLocationToId: data.stockLocationToId,
      assetId: data.assetId,
      quantity: 1,
      reason: data.note || "Returned to inventory",
      performedById: currentUserId, // Use current user from session
      occurredAt: now,
    });

    // 3. Update asset location
    const updateAssetUseCase = container.get<UpdateAssetUseCase>(
      DI_TOKENS.UpdateAssetUseCase,
    );
    await updateAssetUseCase.execute({
      id: data.assetId,
      currentStockLocationId: data.stockLocationToId,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${data.assetId}`);
    revalidatePath("/asset-assignments");

    return {
      success: true,
      data: {
        movement: presentStockMovement(movement),
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "returnAssetAction" },
      "Failed to return asset",
    );
  }
}
