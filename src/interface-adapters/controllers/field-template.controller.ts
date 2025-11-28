/**
 * Field Template Controller
 * Server actions for Field Template CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateFieldTemplateSchema,
  UpdateFieldTemplateSchema,
  CloneFieldTemplateSchema,
  ApplyFieldTemplateSchema,
  FieldTemplateIdSchema,
  ListFieldTemplatesSchema,
  type CreateFieldTemplateDTO,
  type UpdateFieldTemplateDTO,
  type CloneFieldTemplateDTO,
  type ApplyFieldTemplateDTO,
  type ListFieldTemplatesDTO,
} from "../dtos/generated/field-template.dto";
import {
  presentFieldTemplate,
  presentFieldTemplateSummaries,
  type FieldTemplateDTO,
  type FieldTemplateSummaryDTO,
} from "../presenters/field-template.presenter";
import type {
  CreateFieldTemplateUseCase,
  GetFieldTemplateUseCase,
  ListFieldTemplatesUseCase,
  UpdateFieldTemplateUseCase,
  DeleteFieldTemplateUseCase,
  CloneFieldTemplateUseCase,
  ApplyFieldTemplateUseCase,
} from "@/core/use-cases/foundation/field-template";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getSession } from "@/lib/auth/session";

export async function createFieldTemplateAction(
  data: CreateFieldTemplateDTO,
): Promise<ActionResponse<FieldTemplateDTO>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_CREATE);

    const validated = CreateFieldTemplateSchema.parse(data);
    const session = await getSession();

    const container = getContainer();
    const useCase = container.get<CreateFieldTemplateUseCase>(
      DI_TOKENS.CreateFieldTemplateUseCase,
    );

    const template = await useCase.execute({
      name: validated.name,
      code: validated.code,
      description: validated.description,
      entityType: validated.entityType,
      category: validated.category,
      standard: validated.standard,
      isBuiltIn: validated.isBuiltIn,
      metadata: validated.metadata,
      createdById: session?.user?.id ?? null,
      items: validated.items,
    });

    revalidatePath("/field-templates");
    revalidatePath("/field-definitions");

    return {
      success: true,
      data: presentFieldTemplate(template),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createFieldTemplateAction" },
      "Failed to create field template",
    );
  }
}

export async function listFieldTemplatesAction(
  options?: ListFieldTemplatesDTO,
): Promise<ActionResponse<FieldTemplateSummaryDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_VIEW);

    const validated = options ? ListFieldTemplatesSchema.parse(options) : {};

    const container = getContainer();
    const useCase = container.get<ListFieldTemplatesUseCase>(
      DI_TOKENS.ListFieldTemplatesUseCase,
    );

    const result = await useCase.execute(validated);

    return {
      success: true,
      data: presentFieldTemplateSummaries(result.items),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listFieldTemplatesAction" },
      "Failed to list field templates",
    );
  }
}

export async function listFieldTemplatesForEntityAction(
  entityType: string,
): Promise<ActionResponse<FieldTemplateSummaryDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListFieldTemplatesUseCase>(
      DI_TOKENS.ListFieldTemplatesUseCase,
    );

    const templates = await useCase.executeForEntityType(entityType);

    return {
      success: true,
      data: presentFieldTemplateSummaries(templates),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listFieldTemplatesForEntityAction" },
      "Failed to list field templates for entity",
    );
  }
}

export async function getFieldTemplateAction(
  id: string,
): Promise<ActionResponse<FieldTemplateDTO>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_VIEW);

    const validated = FieldTemplateIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetFieldTemplateUseCase>(
      DI_TOKENS.GetFieldTemplateUseCase,
    );

    const template = await useCase.execute(validated.id);

    return {
      success: true,
      data: presentFieldTemplate(template),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getFieldTemplateAction" },
      "Failed to get field template",
    );
  }
}

export async function updateFieldTemplateAction(
  data: UpdateFieldTemplateDTO,
): Promise<ActionResponse<FieldTemplateDTO>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_UPDATE);

    const validated = UpdateFieldTemplateSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateFieldTemplateUseCase>(
      DI_TOKENS.UpdateFieldTemplateUseCase,
    );

    const template = await useCase.execute({
      id: validated.id,
      name: validated.name,
      description: validated.description,
      category: validated.category,
      standard: validated.standard,
      isActive: validated.isActive,
      metadata: validated.metadata,
    });

    revalidatePath("/field-templates");
    revalidatePath(`/field-templates/${validated.id}`);

    return {
      success: true,
      data: presentFieldTemplate(template),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateFieldTemplateAction" },
      "Failed to update field template",
    );
  }
}

export async function deleteFieldTemplateAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_DELETE);

    const validated = FieldTemplateIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteFieldTemplateUseCase>(
      DI_TOKENS.DeleteFieldTemplateUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/field-templates");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteFieldTemplateAction" },
      "Failed to delete field template",
    );
  }
}

export async function cloneFieldTemplateAction(
  data: CloneFieldTemplateDTO,
): Promise<ActionResponse<FieldTemplateDTO>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_CREATE);

    const validated = CloneFieldTemplateSchema.parse(data);
    const session = await getSession();

    const container = getContainer();
    const useCase = container.get<CloneFieldTemplateUseCase>(
      DI_TOKENS.CloneFieldTemplateUseCase,
    );

    const template = await useCase.execute({
      sourceTemplateId: validated.sourceTemplateId,
      newName: validated.newName,
      newCode: validated.newCode,
      createdById: session?.user?.id ?? "",
    });

    revalidatePath("/field-templates");

    return {
      success: true,
      data: presentFieldTemplate(template),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "cloneFieldTemplateAction" },
      "Failed to clone field template",
    );
  }
}

export interface ApplyFieldTemplateResultDTO {
  templateId: string;
  templateName: string;
  createdFieldCount: number;
  linkedFieldCount: number;
  skippedFields: Array<{ fieldName: string; reason: string }>;
}

export async function applyFieldTemplateAction(
  data: ApplyFieldTemplateDTO,
): Promise<ActionResponse<ApplyFieldTemplateResultDTO>> {
  try {
    await requirePermission(PERMISSIONS.FIELD_DEFINITIONS_CREATE);

    const validated = ApplyFieldTemplateSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<ApplyFieldTemplateUseCase>(
      DI_TOKENS.ApplyFieldTemplateUseCase,
    );

    const result = await useCase.execute({
      templateId: validated.templateId,
      targetEntityType: validated.targetEntityType,
      targetEntityId: validated.targetEntityId,
      fieldNames: validated.fieldNames,
      skipExisting: validated.skipExisting,
    });

    // Revalidate all paths that might be affected
    revalidatePath("/field-definitions");
    revalidatePath("/field-templates");
    revalidatePath("/asset-categories");
    revalidatePath("/cmdb/ci-classes");
    revalidatePath("/licenses/products");

    return {
      success: true,
      data: {
        templateId: result.template.id,
        templateName: result.template.name,
        createdFieldCount: result.createdFieldDefinitions.length,
        linkedFieldCount: result.linkedFieldDefinitions.length,
        skippedFields: result.skippedFields,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "applyFieldTemplateAction" },
      "Failed to apply field template",
    );
  }
}
