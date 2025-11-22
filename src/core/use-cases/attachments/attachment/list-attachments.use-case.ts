/**
 * List Attachments Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";
import type { Attachment } from "@/core/domain/entities/attachment.entity";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

export interface ListAttachmentsRequest {
  uploadedById?: string;
  attachmentTypeId?: string;
  targetType?: TargetObjectTypeEnum;
}

@injectable()
export class ListAttachmentsUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentRepository)
    private attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(request: ListAttachmentsRequest = {}): Promise<Attachment[]> {
    // Get all attachments first
    let attachments: Attachment[];

    // If filtering by uploader
    if (request.uploadedById) {
      attachments = await this.attachmentRepository.findByUploader(
        request.uploadedById,
      );
    }
    // If filtering by attachment type
    else if (request.attachmentTypeId) {
      attachments = await this.attachmentRepository.findByAttachmentType(
        request.attachmentTypeId,
      );
    }
    // Otherwise return all
    else {
      attachments = await this.attachmentRepository.findAll();
    }

    // Apply targetType filter if provided
    if (request.targetType) {
      attachments = attachments.filter(
        (attachment) => attachment.targetType === request.targetType,
      );
    }

    return attachments;
  }
}
