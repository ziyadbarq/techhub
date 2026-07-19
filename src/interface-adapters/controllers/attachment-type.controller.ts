/**
 * AttachmentType Controller
 * Handles HTTP requests and responses for attachment type operations
 */

"use server";

import { revalidatePath } from "next/cache";
import type { ActionResponse } from "./types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateAttachmentTypeUseCase,
  GetAttachmentTypeUseCase,
  ListAttachmentTypesUseCase,
  UpdateAttachmentTypeUseCase,
  DeleteAttachmentTypeUseCase,
} from "@/core/use-cases/attachments/attachment-type";
import {
  CreateAttachmentTypeSchema,
  UpdateAttachmentTypeSchema,
  type CreateAttachmentTypeDTO,
  type UpdateAttachmentTypeDTO,
} from "@/interface-adapters/dtos/generated/attachment-type.dto";
import {
  AttachmentTypePresenter,
  type AttachmentTypeDTO,
} from "@/interface-adapters/presenters/attachment-type.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * Create a new attachment type
 */
export async function createAttachmentType(
  data: CreateAttachmentTypeDTO,
): Promise<ActionResponse<AttachmentTypeDTO>> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENT_TYPES_CREATE);

    // Validate input
    const validatedData = CreateAttachmentTypeSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateAttachmentTypeUseCase>(
      DI_TOKENS.CreateAttachmentTypeUseCase,
    );

    // Execute use case
    const attachmentType = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/attachment-types");

    return {
      success: true,
      data: AttachmentTypePresenter.toDTO(attachmentType),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create attachment type",
    };
  }
}

/**
 * Get an attachment type by ID
 */
export async function getAttachmentType(
  id: string,
): Promise<ActionResponse<AttachmentTypeDTO>> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENT_TYPES_VIEW);

    const container = getContainer();
    const useCase = container.get<GetAttachmentTypeUseCase>(
      DI_TOKENS.GetAttachmentTypeUseCase,
    );

    const attachmentType = await useCase.execute({ id });

    return {
      success: true,
      data: AttachmentTypePresenter.toDTO(attachmentType),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get attachment type",
    };
  }
}

/**
 * List all attachment types
 */
export async function listAttachmentTypes(options?: {
  activeOnly?: boolean;
}): Promise<ActionResponse<AttachmentTypeDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENT_TYPES_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAttachmentTypesUseCase>(
      DI_TOKENS.ListAttachmentTypesUseCase,
    );

    const attachmentTypes = await useCase.execute({
      activeOnly: options?.activeOnly,
    });

    return {
      success: true,
      data: AttachmentTypePresenter.toDTOList(attachmentTypes),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list attachment types",
    };
  }
}

/**
 * Update an attachment type
 */
export async function updateAttachmentType(
  id: string,
  data: UpdateAttachmentTypeDTO,
): Promise<ActionResponse<AttachmentTypeDTO>> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENT_TYPES_UPDATE);

    // Validate input
    const validatedData = UpdateAttachmentTypeSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<UpdateAttachmentTypeUseCase>(
      DI_TOKENS.UpdateAttachmentTypeUseCase,
    );

    // Execute use case
    const attachmentType = await useCase.execute({ id, ...validatedData });

    // Revalidate relevant paths
    revalidatePath("/attachment-types");
    revalidatePath(`/attachment-types/${id}`);

    return {
      success: true,
      data: AttachmentTypePresenter.toDTO(attachmentType),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update attachment type",
    };
  }
}

/**
 * Delete an attachment type
 */
export async function deleteAttachmentType(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENT_TYPES_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteAttachmentTypeUseCase>(
      DI_TOKENS.DeleteAttachmentTypeUseCase,
    );

    await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/attachment-types");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete attachment type",
    };
  }
}
