/**
 * Attachment Controller
 * Handles HTTP requests and responses for attachment operations
 */

"use server";

import { revalidatePath } from "next/cache";
import type { ActionResponse } from "./types";
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
import type { GetAttachmentTypeUseCase } from "@/core/use-cases/attachments/attachment-type";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import { getSession } from "@/lib/auth/session";

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/**
 * Resolve the Person record behind the signed-in user.
 *
 * Attachment.uploadedById is a Person foreign key, not a Better Auth user id,
 * so the session user has to be mapped before anything is written.
 */
async function resolveCurrentPersonId(): Promise<string | null> {
  const { user } = await getSession();
  if (!user) {
    return null;
  }

  const container = getContainer();
  const personRepository = container.get<IPersonRepository>(
    DI_TOKENS.IPersonRepository,
  );

  const person =
    (await personRepository.findByUserId(user.id)) ||
    (user.email ? await personRepository.findByEmail(user.email) : null);

  return person?.id ?? null;
}

/**
 * Store an uploaded file and record it as an attachment.
 *
 * Takes FormData so the bytes stream to the server instead of being
 * base64-encoded into a JSON payload. The uploader is deliberately not
 * trusted for identity: the Person id comes from the session here, never
 * from the client.
 */
export async function uploadAttachmentFile(
  formData: FormData,
): Promise<ActionResponse<AttachmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_CREATE);

    const file = formData.get("file");
    const attachmentTypeId = String(formData.get("attachmentTypeId") ?? "");
    const targetType = String(formData.get("targetType") ?? "");
    const targetId = String(formData.get("targetId") ?? "");
    const noteValue = formData.get("note");
    const note = typeof noteValue === "string" ? noteValue.trim() : "";

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "No file was provided" };
    }

    if (!attachmentTypeId || !targetType || !targetId) {
      return {
        success: false,
        error: "Attachment type and target are required",
      };
    }

    const personId = await resolveCurrentPersonId();
    if (!personId) {
      return {
        success: false,
        error:
          "Your user account is not linked to a person record, so uploads cannot be attributed.",
      };
    }

    const container = getContainer();

    // Enforce the type's own rules before writing anything to disk.
    const attachmentType = await container
      .get<GetAttachmentTypeUseCase>(DI_TOKENS.GetAttachmentTypeUseCase)
      .execute({ id: attachmentTypeId });

    if (!attachmentType.isActive) {
      return {
        success: false,
        error: `Attachment type "${attachmentType.name}" is inactive`,
      };
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = attachmentType.allowedExtensions.map((e) =>
      e.toLowerCase(),
    );
    if (!allowed.includes(extension)) {
      return {
        success: false,
        error: `"${attachmentType.name}" accepts only: ${allowed.join(", ")}`,
      };
    }

    const maxBytes = attachmentType.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        success: false,
        error: `File exceeds the ${attachmentType.maxFileSizeMB} MB limit for "${attachmentType.name}"`,
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Some browsers and scanner apps send no type; fall back to the
    // extension so a real PDF is not rejected by the magic-number check.
    const mimeType =
      file.type || MIME_BY_EXTENSION[extension] || "application/octet-stream";

    // The storage service re-checks the magic number against the declared
    // MIME type, so a renamed executable is rejected here rather than stored.
    const fileStorage = container.get<IFileStorageService>(
      DI_TOKENS.IFileStorageService,
    );
    const storagePath = await fileStorage.uploadFile(
      buffer,
      file.name,
      mimeType,
    );

    const useCase = container.get<CreateAttachmentUseCase>(
      DI_TOKENS.CreateAttachmentUseCase,
    );

    const attachment = await useCase.execute(
      CreateAttachmentSchema.parse({
        attachmentTypeId,
        targetType,
        targetId,
        fileName: file.name,
        filePath: storagePath,
        mimeType,
        sizeBytes: BigInt(file.size),
        uploadedById: personId,
        note: note || null,
      }),
    );

    revalidatePath("/attachments");

    return {
      success: true,
      data: AttachmentPresenter.toDTO(attachment),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload attachment",
    };
  }
}

/**
 * Create a new attachment
 */
export async function createAttachment(
  data: CreateAttachmentDTO,
): Promise<ActionResponse<AttachmentDTO>> {
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
): Promise<ActionResponse<AttachmentDTO>> {
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
  targetType?: string;
}): Promise<ActionResponse<AttachmentDTO[]>> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListAttachmentsUseCase>(
      DI_TOKENS.ListAttachmentsUseCase,
    );

    const attachments = await useCase.execute({
      uploadedById: options?.uploadedById,
      attachmentTypeId: options?.attachmentTypeId,
      targetType: options?.targetType as TargetObjectTypeEnum | undefined,
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
): Promise<ActionResponse<AttachmentDTO[]>> {
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
): Promise<ActionResponse<AttachmentDTO>> {
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
 * Download an attachment
 */
export async function downloadAttachment(
  id: string,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetAttachmentUseCase>(
      DI_TOKENS.GetAttachmentUseCase,
    );

    const attachment = await useCase.execute({ id });

    // Always the gated route, never a storage URL: permission is re-checked
    // on every fetch, and the bytes never become publicly reachable.
    const url = `/api/attachments/${attachment.id}/download`;

    return {
      success: true,
      url,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to download attachment",
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
