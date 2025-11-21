/**
 * AssetAssignment Controller
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateAssetAssignmentSchema,
  UpdateAssetAssignmentSchema,
  AssetAssignmentIdSchema,
  ListAssetAssignmentsSchema,
  type CreateAssetAssignmentDTO,
  type UpdateAssetAssignmentDTO,
  type ListAssetAssignmentsDTO,
} from "../dtos/generated/asset-assignment.dto";
import {
  presentAssetAssignment,
  presentAssetAssignments,
  type AssetAssignmentDTO,
} from "../presenters/asset-assignment.presenter";
import type {
  CreateAssetAssignmentUseCase,
  ListAssetAssignmentsUseCase,
  GetAssetAssignmentUseCase,
  UpdateAssetAssignmentUseCase,
  DeleteAssetAssignmentUseCase,
} from "@/core/use-cases/asset/asset-assignment";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createAssetAssignmentAction(
  data: CreateAssetAssignmentDTO,
): Promise<ActionResponse<AssetAssignmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_CREATE);

    const validated = CreateAssetAssignmentSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateAssetAssignmentUseCase>(
      DI_TOKENS.CreateAssetAssignmentUseCase,
    );

    const assignment = await useCase.execute({
      assetId: validated.assetId,
      assigneeType: validated.assigneeType,
      assigneeId: validated.assigneeId,
      startDate: validated.startDate,
      endDate: validated.endDate ?? undefined,
      isPrimary: validated.isPrimary,
      note: validated.note ?? undefined,
    });

    revalidatePath("/asset-assignments");
    revalidatePath(`/assets/${validated.assetId}`);

    return {
      success: true,
      data: presentAssetAssignment(assignment),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createAssetAssignmentAction" },
      "Failed to create asset assignment",
    );
  }
}

export async function listAssetAssignmentsAction(
  options?: ListAssetAssignmentsDTO,
): Promise<ActionResponse<AssetAssignmentDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

    const validated = options
      ? ListAssetAssignmentsSchema.parse(options)
      : undefined;

    const container = getContainer();
    const useCase = container.get<ListAssetAssignmentsUseCase>(
      DI_TOKENS.ListAssetAssignmentsUseCase,
    );

    const assignments = await useCase.execute(validated);

    return {
      success: true,
      data: presentAssetAssignments(assignments),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAssetAssignmentsAction" },
      "Failed to list asset assignments",
    );
  }
}

/**
 * Get active assignment for an asset (if any)
 * Used by Return Asset Wizard to auto-populate assignmentId
 */
export async function getActiveAssignmentAction(
  assetId: string,
): Promise<ActionResponse<AssetAssignmentDTO | null>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAssetAssignmentsUseCase>(
      DI_TOKENS.ListAssetAssignmentsUseCase,
    );

    // Get active assignments for this asset
    const assignments = await useCase.execute({
      assetId,
      activeOnly: true,
    });

    // Return the first active assignment (there should only be one primary)
    const activeAssignment = assignments.length > 0 ? assignments[0] : null;

    return {
      success: true,
      data: activeAssignment ? presentAssetAssignment(activeAssignment) : null,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getActiveAssignmentAction", assetId },
      "Failed to get active assignment",
    );
  }
}

export async function getAssetAssignmentAction(
  id: string,
): Promise<ActionResponse<AssetAssignmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

    const validated = AssetAssignmentIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetAssetAssignmentUseCase>(
      DI_TOKENS.GetAssetAssignmentUseCase,
    );

    const assignment = await useCase.execute(validated.id);

    if (!assignment) {
      return {
        success: false,
        error: "Asset assignment not found",
      };
    }

    return {
      success: true,
      data: presentAssetAssignment(assignment),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetAssignmentAction", id },
      "Failed to get asset assignment",
    );
  }
}

export async function updateAssetAssignmentAction(
  id: string,
  data: UpdateAssetAssignmentDTO,
): Promise<ActionResponse<AssetAssignmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE);

    const validatedId = AssetAssignmentIdSchema.parse({ id });
    const validated = UpdateAssetAssignmentSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateAssetAssignmentUseCase>(
      DI_TOKENS.UpdateAssetAssignmentUseCase,
    );

    const assignment = await useCase.execute({
      id: validatedId.id,
      assigneeType: validated.assigneeType,
      assigneeId: validated.assigneeId,
      startDate: validated.startDate,
      endDate: validated.endDate,
      isPrimary: validated.isPrimary,
      note: validated.note,
    });

    revalidatePath("/asset-assignments");
    revalidatePath(`/asset-assignments/${id}`);
    revalidatePath(`/assets/${assignment.assetId}`);

    return {
      success: true,
      data: presentAssetAssignment(assignment),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateAssetAssignmentAction", id },
      "Failed to update asset assignment",
    );
  }
}

export async function deleteAssetAssignmentAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_DELETE);

    const validated = AssetAssignmentIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteAssetAssignmentUseCase>(
      DI_TOKENS.DeleteAssetAssignmentUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/asset-assignments");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteAssetAssignmentAction", id },
      "Failed to delete asset assignment",
    );
  }
}
