"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./error-handler";
import type { ActionResponse, BulkCreateResult } from "./types";
import type {
  RelationshipTypeDTO,
  CreateRelationshipTypeDTO,
  UpdateRelationshipTypeDTO,
} from "@/interface-adapters/dtos/generated/relationship-type.dto";
import { RelationshipTypePresenter } from "@/interface-adapters/presenters/relationship-type.presenter";
import type { CreateRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/create-relationship-type.use-case";
import type { GetRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/get-relationship-type.use-case";
import type { ListRelationshipTypesUseCase } from "@/core/use-cases/cmdb/relationship-type/list-relationship-types.use-case";
import type { UpdateRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/update-relationship-type.use-case";
import type { DeleteRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/delete-relationship-type.use-case";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createRelationshipTypeAction(
  data: CreateRelationshipTypeDTO,
): Promise<ActionResponse<RelationshipTypeDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get<CreateRelationshipTypeUseCase>(
      DI_TOKENS.CreateRelationshipTypeUseCase,
    );

    const relationshipType = await useCase.execute(data);
    const dto = RelationshipTypePresenter.toDTO(relationshipType);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createRelationshipTypeAction" },
      "Failed to create relationship type",
    );
  }
}

export async function getRelationshipTypeAction(
  id: string,
): Promise<ActionResponse<RelationshipTypeDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get<GetRelationshipTypeUseCase>(
      DI_TOKENS.GetRelationshipTypeUseCase,
    );

    const relationshipType = await useCase.execute({ id });
    const dto = RelationshipTypePresenter.toDTO(relationshipType);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRelationshipTypeAction" },
      "Failed to get relationship type",
    );
  }
}

export async function listRelationshipTypesAction(filters?: {
  bidirectionalOnly?: boolean;
  impactingOnly?: boolean;
}): Promise<ActionResponse<RelationshipTypeDTO[]>> {
  try {
    const container = getContainer();
    const useCase = container.get<ListRelationshipTypesUseCase>(
      DI_TOKENS.ListRelationshipTypesUseCase,
    );

    const relationshipTypes = await useCase.execute(filters);
    const dtos = RelationshipTypePresenter.toDTOList(relationshipTypes);

    return { success: true, data: dtos };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listRelationshipTypesAction" },
      "Failed to list relationship types",
    );
  }
}

export async function updateRelationshipTypeAction(
  id: string,
  updates: UpdateRelationshipTypeDTO,
): Promise<ActionResponse<RelationshipTypeDTO>> {
  try {
    const container = getContainer();
    const useCase = container.get<UpdateRelationshipTypeUseCase>(
      DI_TOKENS.UpdateRelationshipTypeUseCase,
    );

    const relationshipType = await useCase.execute({ id, updates });
    const dto = RelationshipTypePresenter.toDTO(relationshipType);

    return { success: true, data: dto };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateRelationshipTypeAction" },
      "Failed to update relationship type",
    );
  }
}

export async function deleteRelationshipTypeAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    const container = getContainer();
    const useCase = container.get<DeleteRelationshipTypeUseCase>(
      DI_TOKENS.DeleteRelationshipTypeUseCase,
    );

    await useCase.execute({ id });

    return { success: true, data: undefined };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteRelationshipTypeAction" },
      "Failed to delete relationship type",
    );
  }
}

export async function bulkCreateRelationshipTypesAction(
  items: CreateRelationshipTypeDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.RELATIONSHIP_TYPES_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateRelationshipTypeUseCase>(
      DI_TOKENS.CreateRelationshipTypeUseCase,
    );

    const errors: Array<{ index: number; name: string; error: string }> = [];
    let successCount = 0;

    for (let i = 0; i < items.length; i++) {
      try {
        await useCase.execute(items[i]);
        successCount++;
      } catch (error) {
        errors.push({
          index: i + 1,
          name: items[i].name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/relationship-types");

    return {
      success: errors.length === 0,
      successCount,
      errorCount: errors.length,
      errors,
    };
  } catch (_error) {
    return {
      success: false,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
}
