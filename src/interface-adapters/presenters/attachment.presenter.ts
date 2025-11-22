/**
 * Attachment Presenter
 * Transforms Attachment entities to DTOs for the presentation layer
 */

import type { Attachment } from "@/core/domain/entities/attachment.entity";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

export interface AttachmentDTO {
  id: string;
  attachmentTypeId: string;
  targetType: TargetObjectTypeEnum;
  targetId: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  sizeBytes: string | null; // Serialized as string for JSON compatibility
  uploadedById: string;
  uploadedAt: Date;
  note: string | null;
  // Computed fields
  fileExtension: string;
  fileSizeKB: number;
  fileSizeMB: number;
  formattedFileSize: string;
  isImage: boolean;
  isPDF: boolean;
}

export class AttachmentPresenter {
  static toDTO(attachment: Attachment): AttachmentDTO {
    return {
      id: attachment.id,
      attachmentTypeId: attachment.attachmentTypeId,
      targetType: attachment.targetType,
      targetId: attachment.targetId,
      fileName: attachment.fileName,
      filePath: attachment.filePath,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes?.toString() ?? null, // Convert BigInt to string
      uploadedById: attachment.uploadedById,
      uploadedAt: attachment.uploadedAt,
      note: attachment.note,
      // Computed fields
      fileExtension: attachment.getFileExtension(),
      fileSizeKB: attachment.getFileSizeKB(),
      fileSizeMB: attachment.getFileSizeMB(),
      formattedFileSize: attachment.getFormattedFileSize(),
      isImage: attachment.isImage(),
      isPDF: attachment.isPDF(),
    };
  }

  static toDTOList(attachments: Attachment[]): AttachmentDTO[] {
    return attachments.map((attachment) => this.toDTO(attachment));
  }
}
