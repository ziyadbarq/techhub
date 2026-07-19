/**
 * Field Definition Controller
 * Server actions for Field Definition CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateFieldDefinitionSchema,
  UpdateFieldDefinitionSchema,
  FieldDefinitionIdSchema,
  type CreateFieldDefinitionDTO,
  type UpdateFieldDefinitionDTO,
} from "../dtos/generated/field-definition.dto";
import {
  presentFieldDefinition,
  presentFieldDefinitions,
  presentFieldUsageDashboard,
  type FieldDefinitionDTO,
  type FieldUsageDashboardDTO,
} from "../presenters/field-definition.presenter";
import type {
  CreateFieldDefinitionUseCase,
  ListFieldDefinitionsUseCase,
  GetFieldDefinitionUseCase,
  UpdateFieldDefinitionUseCase,
  DeleteFieldDefinitionUseCase,
  GetFieldUsageDashboardUseCase,
} from "@/core/use-cases/foundation/field-definition";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { BulkCreateResult } from "./types";

function getEnumOptions(
  validationRules?: Record<string, unknown> | null,
): string[] | undefined {
  const options = validationRules?.enumOptions;
  if (!Array.isArray(options)) {
    return undefined;
  }

  return options.filter(
    (option): option is string => typeof option === "string",
  );
}

export async function createFieldDefinitionAction(
  data: CreateFieldDefinitionDTO,
): Promise<ActionResponse<FieldDefinitionDTO>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_CREATE);

    const validated = CreateFieldDefinitionSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateFieldDefinitionUseCase>(
      DI_TOKENS.CreateFieldDefinitionUseCase,
    );

    const field = await useCase.execute({
      name: validated.name,
      label: validated.label,
      description: validated.description ?? undefined,
      dataType: validated.dataType,
      entityType: validated.entityType,
      isRequired: validated.isRequired ?? false,
      isUnique: validated.isUnique ?? false,
      defaultValue: validated.defaultValue ?? undefined,
      validationRules: validated.validationRules ?? undefined,
      enumOptions: getEnumOptions(validated.validationRules),
      conditionalLogic: validated.conditionalLogic ?? undefined,
      displayOrder: validated.displayOrder ?? 0,
      isActive: validated.isActive ?? true,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/field-definitions");

    return {
      success: true,
      data: presentFieldDefinition(field),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createFieldDefinitionAction" },
      "Failed to create field definition",
    );
  }
}

export async function listFieldDefinitionsAction(): Promise<
  ActionResponse<FieldDefinitionDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListFieldDefinitionsUseCase>(
      DI_TOKENS.ListFieldDefinitionsUseCase,
    );

    const fields = await useCase.execute();

    return {
      success: true,
      data: presentFieldDefinitions(fields),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listFieldDefinitionsAction" },
      "Failed to list field definitions",
    );
  }
}

export async function getFieldDefinitionAction(
  id: string,
): Promise<ActionResponse<FieldDefinitionDTO>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_VIEW);

    const validated = FieldDefinitionIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetFieldDefinitionUseCase>(
      DI_TOKENS.GetFieldDefinitionUseCase,
    );

    const field = await useCase.execute(validated.id);

    if (!field) {
      return {
        success: false,
        error: "Field definition not found",
      };
    }

    return {
      success: true,
      data: presentFieldDefinition(field),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getFieldDefinitionAction" },
      "Failed to get field definition",
    );
  }
}

export async function updateFieldDefinitionAction(
  data: UpdateFieldDefinitionDTO,
): Promise<ActionResponse<FieldDefinitionDTO>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_UPDATE);

    const validated = UpdateFieldDefinitionSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateFieldDefinitionUseCase>(
      DI_TOKENS.UpdateFieldDefinitionUseCase,
    );

    const field = await useCase.execute({
      id: validated.id,
      name: validated.name,
      label: validated.label,
      dataType: validated.dataType,
      description: validated.description,
      entityType: validated.entityType,
      isRequired: validated.isRequired,
      isUnique: validated.isUnique,
      defaultValue: validated.defaultValue,
      validationRules: validated.validationRules,
      enumOptions: getEnumOptions(validated.validationRules),
      conditionalLogic: validated.conditionalLogic,
      displayOrder: validated.displayOrder,
      isActive: validated.isActive,
      metadata: validated.metadata,
    });

    revalidatePath("/field-definitions");
    revalidatePath(`/field-definitions/${validated.id}`);

    return {
      success: true,
      data: presentFieldDefinition(field),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateFieldDefinitionAction" },
      "Failed to update field definition",
    );
  }
}

export async function deleteFieldDefinitionAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_DELETE);

    const validated = FieldDefinitionIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteFieldDefinitionUseCase>(
      DI_TOKENS.DeleteFieldDefinitionUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/field-definitions");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteFieldDefinitionAction" },
      "Failed to delete field definition",
    );
  }
}

export async function bulkCreateFieldDefinitionsAction(
  items: CreateFieldDefinitionDTO[],
): Promise<BulkCreateResult> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreateFieldDefinitionUseCase>(
      DI_TOKENS.CreateFieldDefinitionUseCase,
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
        const validated = CreateFieldDefinitionSchema.parse(item);

        await useCase.execute({
          name: validated.name,
          label: validated.label,
          description: validated.description ?? undefined,
          dataType: validated.dataType,
          entityType: validated.entityType,
          isRequired: validated.isRequired ?? false,
          isUnique: validated.isUnique ?? false,
          defaultValue: validated.defaultValue ?? undefined,
          validationRules: validated.validationRules ?? undefined,
          enumOptions: getEnumOptions(validated.validationRules),
          conditionalLogic: validated.conditionalLogic ?? undefined,
          displayOrder: validated.displayOrder ?? 0,
          isActive: validated.isActive ?? true,
          metadata: validated.metadata ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          index: i,
          name: item.name || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Set overall success status based on whether there were any errors
    results.success = results.errorCount === 0;

    revalidatePath("/field-definitions");

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
 * Get field usage dashboard statistics
 * Shows aggregated usage data across all field definitions
 */
export async function getFieldUsageDashboardAction(): Promise<
  ActionResponse<FieldUsageDashboardDTO>
> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetFieldUsageDashboardUseCase>(
      DI_TOKENS.GetFieldUsageDashboardUseCase,
    );

    const dashboardData = await useCase.execute();

    return {
      success: true,
      data: presentFieldUsageDashboard(dashboardData),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getFieldUsageDashboardAction" },
      "Failed to get field usage dashboard",
    );
  }
}
