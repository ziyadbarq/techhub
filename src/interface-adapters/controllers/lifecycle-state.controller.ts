/**
 * Lifecycle State Controller
 * Server actions for Lifecycle State CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse, BulkCreateResult } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateLifecycleStateSchema,
  UpdateLifecycleStateSchema,
  LifecycleStateIdSchema,
  type CreateLifecycleStateDTO,
  type UpdateLifecycleStateDTO,
} from "../dtos/generated/lifecycle-state.dto";
import {
  presentLifecycleState,
  presentLifecycleStates,
  type LifecycleStateDTO,
} from "../presenters/lifecycle-state.presenter";
import type {
  CreateLifecycleStateUseCase,
  ListLifecycleStatesUseCase,
  GetLifecycleStateUseCase,
  UpdateLifecycleStateUseCase,
  DeleteLifecycleStateUseCase,
} from "@/core/use-cases/foundation/lifecycle-state";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createLifecycleStateAction(
  data: CreateLifecycleStateDTO,
): Promise<ActionResponse<LifecycleStateDTO>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_STATES_CREATE);

    const validated = CreateLifecycleStateSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateLifecycleStateUseCase>(
      DI_TOKENS.CreateLifecycleStateUseCase,
    );

    const state = await useCase.execute({
      name: validated.name,
      code:
        validated.code?.trim() ||
        validated.name.trim().toUpperCase().replace(/\s+/g, "_"),
      description: validated.description ?? undefined,
      lifecycleModelId: validated.modelId,
      stateType: validated.stateType,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/lifecycle-states");

    return {
      success: true,
      data: presentLifecycleState(state),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createLifecycleStateAction" },
      "Failed to create lifecycle state",
    );
  }
}

export async function listLifecycleStatesAction(): Promise<
  ActionResponse<LifecycleStateDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_STATES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListLifecycleStatesUseCase>(
      DI_TOKENS.ListLifecycleStatesUseCase,
    );

    const states = await useCase.execute();

    return {
      success: true,
      data: presentLifecycleStates(states),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listLifecycleStatesAction" },
      "Failed to list lifecycle states",
    );
  }
}

export async function getLifecycleStateAction(
  id: string,
): Promise<ActionResponse<LifecycleStateDTO>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_STATES_VIEW);

    const validated = LifecycleStateIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetLifecycleStateUseCase>(
      DI_TOKENS.GetLifecycleStateUseCase,
    );

    const state = await useCase.execute(validated.id);

    if (!state) {
      return {
        success: false,
        error: "Lifecycle state not found",
      };
    }

    return {
      success: true,
      data: presentLifecycleState(state),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getLifecycleStateAction" },
      "Failed to get lifecycle state",
    );
  }
}

export async function updateLifecycleStateAction(
  data: UpdateLifecycleStateDTO,
): Promise<ActionResponse<LifecycleStateDTO>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_STATES_UPDATE);

    const validated = UpdateLifecycleStateSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateLifecycleStateUseCase>(
      DI_TOKENS.UpdateLifecycleStateUseCase,
    );

    const state = await useCase.execute({
      id: validated.id,
      name: validated.name,
      description: validated.description,
      stateType: validated.stateType,
      metadata: validated.metadata,
    });

    revalidatePath("/lifecycle-states");
    revalidatePath(`/lifecycle-states/${validated.id}`);

    return {
      success: true,
      data: presentLifecycleState(state),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateLifecycleStateAction" },
      "Failed to update lifecycle state",
    );
  }
}

export async function deleteLifecycleStateAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_STATES_DELETE);

    const validated = LifecycleStateIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteLifecycleStateUseCase>(
      DI_TOKENS.DeleteLifecycleStateUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/lifecycle-states");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteLifecycleStateAction" },
      "Failed to delete lifecycle state",
    );
  }
}

/**
 * Bulk create lifecycle states
 */
export async function bulkCreateLifecycleStatesAction(
  items: CreateLifecycleStateDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_STATES_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateLifecycleStateUseCase>(
      DI_TOKENS.CreateLifecycleStateUseCase,
    );

    const result: BulkCreateResult = {
      success: true,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Process items sequentially
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const validated = CreateLifecycleStateSchema.parse(item);

        await useCase.execute({
          name: validated.name,
          code:
            validated.code?.trim() ||
            validated.name.trim().toUpperCase().replace(/\s+/g, "_"),
          description: validated.description ?? undefined,
          lifecycleModelId: validated.modelId,
          stateType: validated.stateType,
          metadata: validated.metadata ?? undefined,
        });

        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          index: i,
          name: item.name || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    result.success = result.errorCount === 0;

    revalidatePath("/lifecycle-states");

    return result;
  } catch (_error) {
    return {
      success: false,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
}
