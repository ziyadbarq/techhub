/**
 * Get Attachment Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";
import type { Attachment } from "@/core/domain/entities/attachment.entity";

export interface GetAttachmentRequest {
  id: string;
}

@injectable()
export class GetAttachmentUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentRepository)
    private attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(request: GetAttachmentRequest): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findById(request.id);

    if (!attachment) {
      throw new Error("Attachment not found");
    }

    return attachment;
  }
}
