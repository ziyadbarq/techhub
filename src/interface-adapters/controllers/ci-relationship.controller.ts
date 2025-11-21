"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type { CIRelationshipDTO } from "@/interface-adapters/dtos/generated/ci-relationship.dto";
import { CIRelationshipPresenter } from "@/interface-adapters/presenters/ci-relationship.presenter";
import type { CreateCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/create-ci-relationship.use-case";
import type { GetCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/get-ci-relationship.use-case";
import type { ListCIRelationshipsUseCase } from "@/core/use-cases/cmdb/ci-relationship/list-ci-relationships.use-case";
import type { UpdateCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/update-ci-relationship.use-case";
import type { DeleteCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/delete-ci-relationship.use-case";

export async function createCIRelationshipAction(
  fromCiId: string,
  toCiId: string,
  relationshipTypeId: string,
  note?: string,
): Promise<ActionResponse<CIRelationshipDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get<CreateCIRelationshipUseCase>(
      DI_TOKENS.CreateCIRelationshipUseCase,
    );

    const relationship = await useCase.execute({
      fromCiId,
      toCiId,
      relationshipTypeId,
      note,
    });

    const dto = CIRelationshipPresenter.toDTO(relationship);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createCIRelationshipAction" },
      "Failed to create CI relationship",
    );
  }
}

export async function getCIRelationshipAction(
  id: string,
): Promise<ActionResponse<CIRelationshipDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get<GetCIRelationshipUseCase>(
      DI_TOKENS.GetCIRelationshipUseCase,
    );

    const relationship = await useCase.execute({ id });
    const dto = CIRelationshipPresenter.toDTO(relationship);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getCIRelationshipAction" },
      "Failed to get CI relationship",
    );
  }
}

export async function listCIRelationshipsAction(
  ciId?: string,
  relationshipTypeId?: string,
  activeOnly?: boolean,
): Promise<ActionResponse<CIRelationshipDTO[]>> {
  try {
    const container = getContainer();
    const useCase = container.get<ListCIRelationshipsUseCase>(
      DI_TOKENS.ListCIRelationshipsUseCase,
    );

    const relationships = await useCase.execute({
      ciId,
      relationshipTypeId,
      activeOnly,
    });
    const dtos = relationships.map((relationship) =>
      CIRelationshipPresenter.toDTO(relationship),
    );

    return { success: true, data: dtos };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listCIRelationshipsAction" },
      "Failed to list CI relationships",
    );
  }
}

export async function updateCIRelationshipAction(
  id: string,
  updates: { validTo?: Date | null; note?: string | null; isActive?: boolean },
): Promise<ActionResponse<CIRelationshipDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get<UpdateCIRelationshipUseCase>(
      DI_TOKENS.UpdateCIRelationshipUseCase,
    );

    const relationship = await useCase.execute({ id, updates });
    const dto = CIRelationshipPresenter.toDTO(relationship);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateCIRelationshipAction" },
      "Failed to update CI relationship",
    );
  }
}

export async function deleteCIRelationshipAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    const container = getContainer();
    const useCase = container.get<DeleteCIRelationshipUseCase>(
      DI_TOKENS.DeleteCIRelationshipUseCase,
    );

    await useCase.execute({ id });

    return { success: true, data: undefined };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteCIRelationshipAction" },
      "Failed to delete CI relationship",
    );
  }
}
