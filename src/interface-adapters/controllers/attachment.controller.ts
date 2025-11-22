/**
 * Attachment Controller
 * Handles HTTP requests and responses for attachment operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type {
  CreateAttachmentUseCase,
  GetAttachmentUseCase,
  ListAttachmentsUseCase,
  GetAttachmentsByTargetUseCase,
  UpdateAttachmentUseCase,
  DeleteAttachmentUseCase,
} from "@/core/use-cases/attachments/attachment";
import {
  CreateAttachmentSchema,
  UpdateAttachmentSchema,
  type CreateAttachmentDTO,
  type UpdateAttachmentDTO,
} from "@/interface-adapters/dtos/generated/attachment.dto";
import {
  AttachmentPresenter,
  type AttachmentDTO,
} from "@/interface-adapters/presenters/attachment.presenter";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

/**
 * Create a new attachment
 */
export async function createAttachment(
  data: CreateAttachmentDTO,
): Promise<
  { success: true; data: AttachmentDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_CREATE);

    // Validate input
    const validatedData = CreateAttachmentSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<CreateAttachmentUseCase>(
      DI_TOKENS.CreateAttachmentUseCase,
    );

    // Execute use case
    const attachment = await useCase.execute(validatedData);

    // Revalidate relevant paths
    revalidatePath("/attachments");

    return {
      success: true,
      data: AttachmentPresenter.toDTO(attachment),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create attachment",
    };
  }
}

/**
 * Get an attachment by ID
 */
export async function getAttachment(
  id: string,
): Promise<
  { success: true; data: AttachmentDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetAttachmentUseCase>(
      DI_TOKENS.GetAttachmentUseCase,
    );

    const attachment = await useCase.execute({ id });

    return {
      success: true,
      data: AttachmentPresenter.toDTO(attachment),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get attachment",
    };
  }
}

/**
 * List all attachments
 */
export async function listAttachments(options?: {
  uploadedById?: string;
  attachmentTypeId?: string;
}): Promise<
  | { success: true; data: AttachmentDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAttachmentsUseCase>(
      DI_TOKENS.ListAttachmentsUseCase,
    );

    const attachments = await useCase.execute({
      uploadedById: options?.uploadedById,
      attachmentTypeId: options?.attachmentTypeId,
    });

    return {
      success: true,
      data: AttachmentPresenter.toDTOList(attachments),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list attachments",
    };
  }
}

/**
 * List attachments by target (polymorphic)
 */
export async function listAttachmentsByTarget(
  targetType: TargetObjectTypeEnum,
  targetId: string,
): Promise<
  | { success: true; data: AttachmentDTO[] }
  | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetAttachmentsByTargetUseCase>(
      DI_TOKENS.GetAttachmentsByTargetUseCase,
    );

    const attachments = await useCase.execute({ targetType, targetId });

    return {
      success: true,
      data: AttachmentPresenter.toDTOList(attachments),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to list attachments by target",
    };
  }
}

/**
 * Update an attachment
 */
export async function updateAttachment(
  id: string,
  data: UpdateAttachmentDTO,
): Promise<
  { success: true; data: AttachmentDTO } | { success: false; error: string }
> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_UPDATE);

    // Validate input
    const validatedData = UpdateAttachmentSchema.parse(data);

    // Get use case from DI container
    const container = getContainer();
    const useCase = container.get<UpdateAttachmentUseCase>(
      DI_TOKENS.UpdateAttachmentUseCase,
    );

    // Execute use case
    const attachment = await useCase.execute({ id, ...validatedData });

    // Revalidate relevant paths
    revalidatePath("/attachments");
    revalidatePath(`/attachments/${id}`);

    return {
      success: true,
      data: AttachmentPresenter.toDTO(attachment),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update attachment",
    };
  }
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_DELETE);

    const container = getContainer();
    const useCase = container.get<DeleteAttachmentUseCase>(
      DI_TOKENS.DeleteAttachmentUseCase,
    );

    await useCase.execute({ id });

    // Revalidate relevant paths
    revalidatePath("/attachments");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete attachment",
    };
  }
}
