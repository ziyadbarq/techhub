/**
 * Asset Workflow Controller
 * Guided workflows that perform multiple operations atomically
 * Uses IAssetMovementService for automatic source tracking
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { getSession } from "@/lib/auth/session";
import type {
  CreateAssetAssignmentUseCase,
  UpdateAssetAssignmentUseCase,
} from "@/core/use-cases/asset/asset-assignment";
import type { IAssetMovementService } from "@/core/services/asset-movement.service.interface";
import type { UpdateAssetUseCase } from "@/core/use-cases/asset/asset";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
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

async function resolveCurrentPersonId(
  container: ReturnType<typeof getContainer>,
) {
  const { user } = await getSession();
  if (!user) {
    return { personId: null, error: "Not authenticated" };
  }

  const personRepository = container.get<IPersonRepository>(
    DI_TOKENS.IPersonRepository,
  );

  // Prefer explicit user linkage, fallback to email match for existing records
  const person =
    (await personRepository.findByUserId(user.id)) ||
    (user.email ? await personRepository.findByEmail(user.email) : null);

  if (!person) {
    return {
      personId: null,
      error:
        "Your account is not linked to a person record. Ask an admin to link your user to a Person before assigning assets.",
    };
  }

  return { personId: person.id, error: null };
}

/**
 * Assign Asset to Employee Workflow
 * 1. Creates assignment (PERSON type)
 * 2. Creates stock movement OUT with source tracking
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

    const container = getContainer();
    const { personId, error } = await resolveCurrentPersonId(container);
    if (!personId) {
      return {
        success: false,
        error: error ?? "Authentication required",
      };
    }

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

    // 2. Create stock movement OUT with source tracking
    const assetMovementService = container.get<IAssetMovementService>(
      DI_TOKENS.IAssetMovementService,
    );
    const movement = data.stockLocationFromId
      ? await assetMovementService.recordAssetIssued({
          assetId: data.assetId,
          stockLocationId: data.stockLocationFromId,
          performedById: personId,
          reason: `Assigned to employee`,
          source: "ASSIGNMENT",
          sourceReferenceType: "AssetAssignment",
          sourceReferenceId: assignment.id,
        })
      : await assetMovementService.createMovement({
          movementType: "OUT",
          assetId: data.assetId,
          stockLocationFromId: null,
          performedById: personId,
          reason: `Assigned to employee`,
          source: "ASSIGNMENT",
          sourceReferenceType: "AssetAssignment",
          sourceReferenceId: assignment.id,
        });

    // 3. Update asset location (set to null since assigned to person)
    const updateAssetUseCase = container.get<UpdateAssetUseCase>(
      DI_TOKENS.UpdateAssetUseCase,
    );
    const updatedAsset = await updateAssetUseCase.execute({
      id: data.assetId,
      currentStockLocationId: null,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${updatedAsset.assetTag}`);
    revalidatePath("/asset-assignments");
    revalidatePath("/stock-movements");

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
 * 2. Creates stock movement IN with source tracking
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

    const container = getContainer();
    const { personId, error } = await resolveCurrentPersonId(container);
    if (!personId) {
      return {
        success: false,
        error: error ?? "Authentication required",
      };
    }

    const now = new Date();

    // 1. End assignment
    const updateAssignmentUseCase = container.get<UpdateAssetAssignmentUseCase>(
      DI_TOKENS.UpdateAssetAssignmentUseCase,
    );
    await updateAssignmentUseCase.execute({
      id: data.assignmentId,
      endDate: now,
    });

    // 2. Create stock movement IN with source tracking
    const assetMovementService = container.get<IAssetMovementService>(
      DI_TOKENS.IAssetMovementService,
    );
    const movement = await assetMovementService.recordAssetReceived({
      assetId: data.assetId,
      stockLocationId: data.stockLocationToId,
      performedById: personId,
      reason: data.note || "Returned to inventory",
      source: "RETURN",
      sourceReferenceType: "AssetAssignment",
      sourceReferenceId: data.assignmentId,
    });

    // 3. Update asset location
    const updateAssetUseCase = container.get<UpdateAssetUseCase>(
      DI_TOKENS.UpdateAssetUseCase,
    );
    const updatedAsset = await updateAssetUseCase.execute({
      id: data.assetId,
      currentStockLocationId: data.stockLocationToId,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${updatedAsset.assetTag}`);
    revalidatePath("/asset-assignments");
    revalidatePath("/stock-movements");

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
