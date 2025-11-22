/**
 * AttachmentType Presenter
 * Transforms AttachmentType entities to DTOs for the presentation layer
 */

import type { AttachmentType } from "@/core/domain/entities/attachment-type.entity";

export interface AttachmentTypeDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  allowedExtensions: string[];
  maxFileSizeMB: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AttachmentTypePresenter {
  static toDTO(attachmentType: AttachmentType): AttachmentTypeDTO {
    return {
      id: attachmentType.id,
      name: attachmentType.name,
      code: attachmentType.code,
      description: attachmentType.description,
      allowedExtensions: attachmentType.allowedExtensions,
      maxFileSizeMB: attachmentType.maxFileSizeMB,
      isActive: attachmentType.isActive,
      createdAt: attachmentType.createdAt,
      updatedAt: attachmentType.updatedAt,
    };
  }

  static toDTOList(attachmentTypes: AttachmentType[]): AttachmentTypeDTO[] {
    return attachmentTypes.map((attachmentType) => this.toDTO(attachmentType));
  }
}
