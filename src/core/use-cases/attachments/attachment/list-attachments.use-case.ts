/**
 * List Attachments Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";
import type { Attachment } from "@/core/domain/entities/attachment.entity";

export interface ListAttachmentsRequest {
  uploadedById?: string;
  attachmentTypeId?: string;
}

@injectable()
export class ListAttachmentsUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentRepository)
    private attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(request: ListAttachmentsRequest = {}): Promise<Attachment[]> {
    // If filtering by uploader
    if (request.uploadedById) {
      return await this.attachmentRepository.findByUploader(
        request.uploadedById,
      );
    }

    // If filtering by attachment type
    if (request.attachmentTypeId) {
      return await this.attachmentRepository.findByAttachmentType(
        request.attachmentTypeId,
      );
    }

    // Otherwise return all
    return await this.attachmentRepository.findAll();
  }
}
