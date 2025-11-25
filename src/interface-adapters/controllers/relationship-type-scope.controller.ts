/**
 * Relationship Type Scope Controller
 * Server actions for relationship type scope operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ActionResponse, BulkCreateResult } from "./types";
import {
  CreateRelationshipTypeScopeSchema,
  UpdateRelationshipTypeScopeSchema,
  type CreateRelationshipTypeScopeDTO,
  type UpdateRelationshipTypeScopeDTO,
} from "@/interface-adapters/dtos/generated/relationship-type-scope.dto";
import {
  RelationshipTypeScopePresenter,
  type RelationshipTypeScopeDTO,
} from "@/interface-adapters/presenters/relationship-type-scope.presenter";
import type {
  CreateRelationshipTypeScopeUseCase,
  GetRelationshipTypeScopeUseCase,
  ListRelationshipTypeScopesUseCase,
  UpdateRelationshipTypeScopeUseCase,
  DeleteRelationshipTypeScopeUseCase,
} from "@/core/use-cases/relationship-type-scope";

/**
 * Create a new relationship type scope
 */
export async function createRelationshipTypeScopeAction(
  data: CreateRelationshipTypeScopeDTO,
): Promise<ActionResponse<RelationshipTypeScopeDTO>> {
  try {
    await requirePermission(PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_CREATE);

    const validated = CreateRelationshipTypeScopeSchema.parse(data);
    const container = getContainer();
    const useCase = container.get<CreateRelationshipTypeScopeUseCase>(
      DI_TOKENS.CreateRelationshipTypeScopeUseCase,
    );

    const scope = await useCase.execute(validated);

    revalidatePath("/relationship-types");
    revalidatePath("/relationship-type-scopes");

    return {
      success: true,
      data: RelationshipTypeScopePresenter.toDTO(scope),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create relationship type scope",
    };
  }
}

/**
 * Get a relationship type scope by ID
 */
export async function getRelationshipTypeScopeAction(
  id: string,
): Promise<ActionResponse<RelationshipTypeScopeDTO>> {
  try {
    await requirePermission(PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetRelationshipTypeScopeUseCase>(
      DI_TOKENS.GetRelationshipTypeScopeUseCase,
    );

    const scope = await useCase.execute({ id });

    return {
      success: true,
      data: RelationshipTypeScopePresenter.toDTO(scope),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get relationship type scope",
    };
  }
}

/**
 * List relationship type scopes with optional filters
 */
export async function listRelationshipTypeScopesAction(params?: {
  relationshipTypeId?: string;
  fromCiClassId?: string;
  toCiClassId?: string;
}): Promise<ActionResponse<RelationshipTypeScopeDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListRelationshipTypeScopesUseCase>(
      DI_TOKENS.ListRelationshipTypeScopesUseCase,
    );

    const scopes = await useCase.execute(params ?? {});

    return {
      success: true,
      data: RelationshipTypeScopePresenter.toDTOList(scopes),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list relationship type scopes",
    };
  }
}

/**
 * Update a relationship type scope
 */
export async function updateRelationshipTypeScopeAction(
  id: string,
  data: UpdateRelationshipTypeScopeDTO,
): Promise<ActionResponse<RelationshipTypeScopeDTO>> {
  try {
    await requirePermission(PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_UPDATE);

    const validated = UpdateRelationshipTypeScopeSchema.parse(data);
    const container = getContainer();
    const useCase = container.get<UpdateRelationshipTypeScopeUseCase>(
      DI_TOKENS.UpdateRelationshipTypeScopeUseCase,
    );

    const scope = await useCase.execute({
      id,
      ...validated,
    });

    revalidatePath("/relationship-types");
    revalidatePath("/relationship-type-scopes");

    return {
      success: true,
      data: RelationshipTypeScopePresenter.toDTO(scope),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update relationship type scope",
    };
  }
}

/**
 * Delete a relationship type scope
 */
export async function deleteRelationshipTypeScopeAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteRelationshipTypeScopeUseCase>(
      DI_TOKENS.DeleteRelationshipTypeScopeUseCase,
    );

    await useCase.execute({ id });

    revalidatePath("/relationship-types");
    revalidatePath("/relationship-type-scopes");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete relationship type scope",
    };
  }
}

/**
 * Bulk create relationship type scopes
 */
export async function bulkCreateRelationshipTypeScopesAction(
  items: CreateRelationshipTypeScopeDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.RELATIONSHIP_TYPE_SCOPES_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateRelationshipTypeScopeUseCase>(
      DI_TOKENS.CreateRelationshipTypeScopeUseCase,
    );

    const results: BulkCreateResult = {
      success: true,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Process items sequentially to avoid overwhelming the database
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const validated = CreateRelationshipTypeScopeSchema.parse(item);

        await useCase.execute(validated);

        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          index: i,
          name: item.relationshipTypeId || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Set overall success status based on whether there were any errors
    results.success = results.errorCount === 0;

    revalidatePath("/relationship-type-scopes");

    return results;
  } catch (_error) {
    return {
      success: false,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
}
