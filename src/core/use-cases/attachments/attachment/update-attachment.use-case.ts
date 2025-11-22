/**
 * Update Attachment Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";
import type { Attachment } from "@/core/domain/entities/attachment.entity";

export interface UpdateAttachmentRequest {
  id: string;
  attachmentTypeId?: string;
  fileName?: string;
  filePath?: string;
  mimeType?: string | null;
  sizeBytes?: bigint | null;
  note?: string | null;
}

@injectable()
export class UpdateAttachmentUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentRepository)
    private attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(request: UpdateAttachmentRequest): Promise<Attachment> {
    // Get existing attachment
    const attachment = await this.attachmentRepository.findById(request.id);

    if (!attachment) {
      throw new Error("Attachment not found");
    }

    // Update fields if provided
    if (request.attachmentTypeId !== undefined) {
      attachment.attachmentTypeId = request.attachmentTypeId;
    }

    if (request.fileName !== undefined) {
      attachment.fileName = request.fileName;
    }

    if (request.filePath !== undefined) {
      attachment.filePath = request.filePath;
    }

    if (request.mimeType !== undefined) {
      attachment.mimeType = request.mimeType;
    }

    if (request.sizeBytes !== undefined) {
      attachment.sizeBytes = request.sizeBytes;
    }

    if (request.note !== undefined) {
      attachment.note = request.note;
    }

    return await this.attachmentRepository.update(attachment);
  }
}
