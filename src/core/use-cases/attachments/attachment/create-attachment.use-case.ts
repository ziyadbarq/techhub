/**
 * Create Attachment Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";
import { Attachment } from "@/core/domain/entities/attachment.entity";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

export interface CreateAttachmentRequest {
  attachmentTypeId: string;
  targetType: TargetObjectTypeEnum;
  targetId: string;
  fileName: string;
  filePath: string;
  mimeType?: string | null;
  sizeBytes?: bigint | null;
  uploadedById: string;
  note?: string | null;
}

@injectable()
export class CreateAttachmentUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentRepository)
    private attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(request: CreateAttachmentRequest): Promise<Attachment> {
    // Create attachment entity
    const attachment = Attachment.create({
      attachmentTypeId: request.attachmentTypeId,
      targetType: request.targetType,
      targetId: request.targetId,
      fileName: request.fileName,
      filePath: request.filePath,
      mimeType: request.mimeType,
      sizeBytes: request.sizeBytes,
      uploadedById: request.uploadedById,
      note: request.note,
    });

    return await this.attachmentRepository.create(attachment);
  }
}
