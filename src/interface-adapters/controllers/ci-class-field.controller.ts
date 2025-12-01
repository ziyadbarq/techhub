/**
 * CI Class Field Controller
 * Server actions for CI class field operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ActionResponse, BulkCreateResult } from "./types";
import {
  CreateCIClassFieldSchema,
  UpdateCIClassFieldSchema,
  type CreateCIClassFieldDTO,
  type UpdateCIClassFieldDTO,
} from "@/interface-adapters/dtos/generated/ci-class-field.dto";
import {
  CIClassFieldPresenter,
  type CIClassFieldDTO,
  type EnrichedCIClassFieldDTO,
} from "@/interface-adapters/presenters/ci-class-field.presenter";
import type {
  CreateCIClassFieldUseCase,
  GetCIClassFieldUseCase,
  ListCIClassFieldsUseCase,
  UpdateCIClassFieldUseCase,
  DeleteCIClassFieldUseCase,
} from "@/core/use-cases/ci-class-field";
import type { ICIClassFieldRepository } from "@/core/repositories/ci-class-field.repository.interface";

/**
 * Create a new CI class field
 */
export async function createCIClassFieldAction(
  data: CreateCIClassFieldDTO,
): Promise<ActionResponse<CIClassFieldDTO>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASS_FIELDS_CREATE);

    const validated = CreateCIClassFieldSchema.parse(data);
    const container = getContainer();
    const useCase = container.get<CreateCIClassFieldUseCase>(
      DI_TOKENS.CreateCIClassFieldUseCase,
    );

    const ciClassField = await useCase.execute(validated);

    revalidatePath("/ci-classes");
    revalidatePath("/ci-class-fields");

    return {
      success: true,
      data: CIClassFieldPresenter.toDTO(ciClassField),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create CI class field",
    };
  }
}

/**
 * Get a CI class field by ID
 */
export async function getCIClassFieldAction(
  id: string,
): Promise<ActionResponse<CIClassFieldDTO>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASS_FIELDS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetCIClassFieldUseCase>(
      DI_TOKENS.GetCIClassFieldUseCase,
    );

    const ciClassField = await useCase.execute({ id });

    return {
      success: true,
      data: CIClassFieldPresenter.toDTO(ciClassField),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get CI class field",
    };
  }
}

/**
 * List CI class fields with optional filters
 */
export async function listCIClassFieldsAction(params?: {
  ciClassId?: string;
  fieldDefinitionId?: string;
}): Promise<ActionResponse<CIClassFieldDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASS_FIELDS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListCIClassFieldsUseCase>(
      DI_TOKENS.ListCIClassFieldsUseCase,
    );

    const ciClassFields = await useCase.execute(params ?? {});

    return {
      success: true,
      data: CIClassFieldPresenter.toDTOList(ciClassFields),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list CI class fields",
    };
  }
}

/**
 * Update a CI class field
 */
export async function updateCIClassFieldAction(
  id: string,
  data: UpdateCIClassFieldDTO,
): Promise<ActionResponse<CIClassFieldDTO>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASS_FIELDS_UPDATE);

    const validated = UpdateCIClassFieldSchema.parse(data);
    const container = getContainer();
    const useCase = container.get<UpdateCIClassFieldUseCase>(
      DI_TOKENS.UpdateCIClassFieldUseCase,
    );

    const ciClassField = await useCase.execute({
      id,
      ...validated,
    });

    revalidatePath("/ci-classes");
    revalidatePath("/ci-class-fields");

    return {
      success: true,
      data: CIClassFieldPresenter.toDTO(ciClassField),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update CI class field",
    };
  }
}

/**
 * Delete a CI class field
 */
export async function deleteCIClassFieldAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASS_FIELDS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteCIClassFieldUseCase>(
      DI_TOKENS.DeleteCIClassFieldUseCase,
    );

    await useCase.execute({ id });

    revalidatePath("/ci-classes");
    revalidatePath("/ci-class-fields");

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
          : "Failed to delete CI class field",
    };
  }
}

/**
 * Bulk create CI class fields
 */
export async function bulkCreateCIClassFieldsAction(
  items: CreateCIClassFieldDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASS_FIELDS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateCIClassFieldUseCase>(
      DI_TOKENS.CreateCIClassFieldUseCase,
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
        const validated = CreateCIClassFieldSchema.parse(item);

        await useCase.execute(validated);

        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          index: i,
          name: item.ciClassId || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Set overall success status based on whether there were any errors
    results.success = results.errorCount === 0;

    revalidatePath("/ci-classes");
    revalidatePath("/ci-class-fields");

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

/**
 * List enriched CI class fields for a specific CI class
 * Returns fields with full FieldDefinition details for form rendering
 */
export async function listEnrichedCIClassFieldsAction(
  ciClassId: string,
): Promise<ActionResponse<EnrichedCIClassFieldDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.CI_CLASS_FIELDS_VIEW);

    const container = getContainer();
    const repository = container.get<ICIClassFieldRepository>(
      DI_TOKENS.ICIClassFieldRepository,
    );
    const fieldsWithDefinition =
      await repository.findByCIClassIdWithDefinition(ciClassId);

    return {
      success: true,
      data: CIClassFieldPresenter.toEnrichedDTOList(fieldsWithDefinition),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list enriched CI class fields",
    };
  }
}
