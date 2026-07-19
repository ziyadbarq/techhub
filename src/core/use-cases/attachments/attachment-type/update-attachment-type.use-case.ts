/**
 * Update AttachmentType Use Case
 */

import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentTypeRepository } from "@/core/repositories/attachment-type.repository.interface";
import type { AttachmentType } from "@/core/domain/entities/attachment-type.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateAttachmentTypeRequest {
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  allowedExtensions?: string[];
  maxFileSizeMB?: number;
  isActive?: boolean;
}

@injectable()
export class UpdateAttachmentTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentTypeRepository)
    private attachmentTypeRepository: IAttachmentTypeRepository,
  ) {}

  async execute(request: UpdateAttachmentTypeRequest): Promise<AttachmentType> {
    // Find existing attachment type
    const attachmentType = await this.attachmentTypeRepository.findById(
      request.id,
    );
    if (!attachmentType) {
      throw new NotFoundError("Attachment type not found");
    }

    // Check for duplicate name if name is being changed
    if (request.name && request.name !== attachmentType.name) {
      const existingByName = await this.attachmentTypeRepository.existsByName(
        request.name,
        request.id,
      );
      if (existingByName) {
        throw new ConflictError(
          "An attachment type with this name already exists",
        );
      }
      attachmentType.name = request.name;
    }

    // Check for duplicate code if code is being changed
    if (request.code && request.code !== attachmentType.code) {
      const existingByCode = await this.attachmentTypeRepository.existsByCode(
        request.code,
        request.id,
      );
      if (existingByCode) {
        throw new ConflictError(
          "An attachment type with this code already exists",
        );
      }
      attachmentType.code = request.code;
    }

    // Update other fields
    if (request.description !== undefined) {
      attachmentType.description = request.description;
    }

    if (request.allowedExtensions !== undefined) {
      attachmentType.updateAllowedExtensions(request.allowedExtensions);
    }

    if (request.maxFileSizeMB !== undefined) {
      attachmentType.maxFileSizeMB = request.maxFileSizeMB;
    }

    if (request.isActive !== undefined) {
      if (request.isActive) {
        attachmentType.activate();
      } else {
        attachmentType.deactivate();
      }
    }

    return await this.attachmentTypeRepository.update(attachmentType);
  }
}
