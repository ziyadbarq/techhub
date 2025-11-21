/**
 * CI Class Controller
 * Server actions for CI class operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateCIClassSchema,
  UpdateCIClassSchema,
  type CreateCIClassDTO,
  type UpdateCIClassDTO,
} from "../dtos/generated/ci-class.dto";
import {
  CIClassPresenter,
  type CIClassDTO,
} from "../presenters/ci-class.presenter";
import type {
  CreateCIClassUseCase,
  GetCIClassUseCase,
  ListCIClassesUseCase,
  UpdateCIClassUseCase,
  DeleteCIClassUseCase,
} from "@/core/use-cases/ci-class";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createCIClassAction(
  data: CreateCIClassDTO,
): Promise<ActionResponse<CIClassDTO>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASSES_CREATE);

    const validated = CreateCIClassSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateCIClassUseCase>(
      DI_TOKENS.CreateCIClassUseCase,
    );

    const ciClass = await useCase.execute({
      name: validated.name,
      code: validated.code,
      parentClassId: validated.parentClassId,
      description: validated.description,
      lifecycleModelId: validated.lifecycleModelId,
      defaultCriticality: validated.defaultCriticality,
      defaultEnvironment: validated.defaultEnvironment,
      isDiscoverable: validated.isDiscoverable,
    });

    revalidatePath("/ci-classes");

    return {
      success: true,
      data: CIClassPresenter.toDTO(ciClass),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createCIClassAction" },
      "Failed to create CI class",
    );
  }
}

export async function listCIClassesAction(params?: {
  parentId?: string | null;
}): Promise<ActionResponse<CIClassDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASSES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListCIClassesUseCase>(
      DI_TOKENS.ListCIClassesUseCase,
    );

    const ciClasses = await useCase.execute(params || {});

    return {
      success: true,
      data: CIClassPresenter.toDTOList(ciClasses),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listCIClassesAction" },
      "Failed to list CI classes",
    );
  }
}

export async function getCIClassAction(
  id: string,
): Promise<ActionResponse<CIClassDTO>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASSES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetCIClassUseCase>(
      DI_TOKENS.GetCIClassUseCase,
    );

    const ciClass = await useCase.execute({ ciClassId: id });

    return {
      success: true,
      data: CIClassPresenter.toDTO(ciClass),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getCIClassAction", id },
      "Failed to get CI class",
    );
  }
}

export async function updateCIClassAction(
  id: string,
  data: UpdateCIClassDTO,
): Promise<ActionResponse<CIClassDTO>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASSES_UPDATE);

    const validated = UpdateCIClassSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateCIClassUseCase>(
      DI_TOKENS.UpdateCIClassUseCase,
    );

    const ciClass = await useCase.execute({
      ciClassId: id,
      ...validated,
    });

    revalidatePath("/ci-classes");
    revalidatePath(`/ci-classes/${id}`);

    return {
      success: true,
      data: CIClassPresenter.toDTO(ciClass),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateCIClassAction", id },
      "Failed to update CI class",
    );
  }
}

export async function deleteCIClassAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASSES_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteCIClassUseCase>(
      DI_TOKENS.DeleteCIClassUseCase,
    );

    await useCase.execute({ ciClassId: id });

    revalidatePath("/ci-classes");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteCIClassAction", id },
      "Failed to delete CI class",
    );
  }
}
