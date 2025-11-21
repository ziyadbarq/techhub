/**
 * Lifecycle Transition Controller
 * Server actions for Lifecycle Transition CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateLifecycleTransitionSchema,
  UpdateLifecycleTransitionSchema,
  LifecycleTransitionIdSchema,
  type CreateLifecycleTransitionDTO,
  type UpdateLifecycleTransitionDTO,
} from "../dtos/generated/lifecycle-transition.dto";
import {
  presentLifecycleTransition,
  presentLifecycleTransitions,
  type LifecycleTransitionDTO,
} from "../presenters/lifecycle-transition.presenter";
import type {
  CreateLifecycleTransitionUseCase,
  ListLifecycleTransitionsUseCase,
  GetLifecycleTransitionUseCase,
  UpdateLifecycleTransitionUseCase,
  DeleteLifecycleTransitionUseCase,
} from "@/core/use-cases/foundation/lifecycle-transition";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createLifecycleTransitionAction(
  data: CreateLifecycleTransitionDTO,
): Promise<ActionResponse<LifecycleTransitionDTO>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_TRANSITIONS_CREATE);

    const validated = CreateLifecycleTransitionSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateLifecycleTransitionUseCase>(
      DI_TOKENS.CreateLifecycleTransitionUseCase,
    );

    const transition = await useCase.execute({
      name: validated.name,
      description: validated.description ?? undefined,
      lifecycleModelId: validated.modelId,
      fromStateId: validated.fromStateId,
      toStateId: validated.toStateId,
      conditions: validated.conditions ?? undefined,
      requiresApproval: validated.requiresApproval ?? false,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/lifecycle-transitions");

    return {
      success: true,
      data: presentLifecycleTransition(transition),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createLifecycleTransitionAction" },
      "Failed to create lifecycle transition",
    );
  }
}

export async function listLifecycleTransitionsAction(): Promise<
  ActionResponse<LifecycleTransitionDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListLifecycleTransitionsUseCase>(
      DI_TOKENS.ListLifecycleTransitionsUseCase,
    );

    const transitions = await useCase.execute();

    return {
      success: true,
      data: presentLifecycleTransitions(transitions),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listLifecycleTransitionsAction" },
      "Failed to list lifecycle transitions",
    );
  }
}

export async function getLifecycleTransitionAction(
  id: string,
): Promise<ActionResponse<LifecycleTransitionDTO>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW);

    const validated = LifecycleTransitionIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetLifecycleTransitionUseCase>(
      DI_TOKENS.GetLifecycleTransitionUseCase,
    );

    const transition = await useCase.execute(validated.id);

    if (!transition) {
      return {
        success: false,
        error: "Lifecycle transition not found",
      };
    }

    return {
      success: true,
      data: presentLifecycleTransition(transition),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getLifecycleTransitionAction" },
      "Failed to get lifecycle transition",
    );
  }
}

export async function updateLifecycleTransitionAction(
  data: UpdateLifecycleTransitionDTO,
): Promise<ActionResponse<LifecycleTransitionDTO>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_TRANSITIONS_UPDATE);

    const validated = UpdateLifecycleTransitionSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateLifecycleTransitionUseCase>(
      DI_TOKENS.UpdateLifecycleTransitionUseCase,
    );

    const transition = await useCase.execute({
      id: validated.id,
      name: validated.name,
      description: validated.description,
      conditions: validated.conditions,
      requiresApproval: validated.requiresApproval,
      metadata: validated.metadata,
    });

    revalidatePath("/lifecycle-transitions");
    revalidatePath(`/lifecycle-transitions/${validated.id}`);

    return {
      success: true,
      data: presentLifecycleTransition(transition),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateLifecycleTransitionAction" },
      "Failed to update lifecycle transition",
    );
  }
}

export async function deleteLifecycleTransitionAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_TRANSITIONS_DELETE);

    const validated = LifecycleTransitionIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteLifecycleTransitionUseCase>(
      DI_TOKENS.DeleteLifecycleTransitionUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/lifecycle-transitions");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteLifecycleTransitionAction" },
      "Failed to delete lifecycle transition",
    );
  }
}
