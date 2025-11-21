/**
 * Lifecycle Model Controller
 * Server actions for Lifecycle Model CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateLifecycleModelSchema,
  UpdateLifecycleModelSchema,
  LifecycleModelIdSchema,
  type CreateLifecycleModelDTO,
  type UpdateLifecycleModelDTO,
} from "../dtos/generated/lifecycle-model.dto";
import {
  presentLifecycleModel,
  presentLifecycleModels,
  type LifecycleModelDTO,
} from "../presenters/lifecycle-model.presenter";
import type {
  CreateLifecycleModelUseCase,
  ListLifecycleModelsUseCase,
  GetLifecycleModelUseCase,
  UpdateLifecycleModelUseCase,
  DeleteLifecycleModelUseCase,
} from "@/core/use-cases/foundation/lifecycle-model";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createLifecycleModelAction(
  data: CreateLifecycleModelDTO,
): Promise<ActionResponse<LifecycleModelDTO>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_MODELS_CREATE);

    const validated = CreateLifecycleModelSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateLifecycleModelUseCase>(
      DI_TOKENS.CreateLifecycleModelUseCase,
    );

    const model = await useCase.execute({
      name: validated.name,
      description: validated.description ?? undefined,
    });

    revalidatePath("/lifecycle-models");

    return {
      success: true,
      data: presentLifecycleModel(model),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createLifecycleModelAction" },
      "Failed to create lifecycle model",
    );
  }
}

export async function listLifecycleModelsAction(): Promise<
  ActionResponse<LifecycleModelDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_MODELS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListLifecycleModelsUseCase>(
      DI_TOKENS.ListLifecycleModelsUseCase,
    );

    const models = await useCase.execute();

    return {
      success: true,
      data: presentLifecycleModels(models),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listLifecycleModelsAction" },
      "Failed to list lifecycle models",
    );
  }
}

export async function getLifecycleModelAction(
  id: string,
): Promise<ActionResponse<LifecycleModelDTO>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_MODELS_VIEW);

    const validated = LifecycleModelIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetLifecycleModelUseCase>(
      DI_TOKENS.GetLifecycleModelUseCase,
    );

    const model = await useCase.execute(validated.id);

    if (!model) {
      return {
        success: false,
        error: "Lifecycle model not found",
      };
    }

    return {
      success: true,
      data: presentLifecycleModel(model),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getLifecycleModelAction" },
      "Failed to get lifecycle model",
    );
  }
}

export async function updateLifecycleModelAction(
  data: UpdateLifecycleModelDTO,
): Promise<ActionResponse<LifecycleModelDTO>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_MODELS_UPDATE);

    const validated = UpdateLifecycleModelSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateLifecycleModelUseCase>(
      DI_TOKENS.UpdateLifecycleModelUseCase,
    );

    const model = await useCase.execute({
      id: validated.id,
      name: validated.name,
      description: validated.description,
    });

    revalidatePath("/lifecycle-models");
    revalidatePath(`/lifecycle-models/${validated.id}`);

    return {
      success: true,
      data: presentLifecycleModel(model),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateLifecycleModelAction" },
      "Failed to update lifecycle model",
    );
  }
}

export async function deleteLifecycleModelAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.LIFECYCLE_MODELS_DELETE);

    const validated = LifecycleModelIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteLifecycleModelUseCase>(
      DI_TOKENS.DeleteLifecycleModelUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/lifecycle-models");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteLifecycleModelAction" },
      "Failed to delete lifecycle model",
    );
  }
}
