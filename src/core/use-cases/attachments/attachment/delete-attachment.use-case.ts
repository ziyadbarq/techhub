/**
 * Delete Attachment Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteAttachmentRequest {
  id: string;
}

@injectable()
export class DeleteAttachmentUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentRepository)
    private attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(request: DeleteAttachmentRequest): Promise<void> {
    // Verify attachment exists
    const attachment = await this.attachmentRepository.findById(request.id);

    if (!attachment) {
      throw new NotFoundError("Attachment not found");
    }

    await this.attachmentRepository.delete(request.id);
  }
}
