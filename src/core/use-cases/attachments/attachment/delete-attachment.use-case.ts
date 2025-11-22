/**
 * Delete Attachment Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";

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
      throw new Error("Attachment not found");
    }

    await this.attachmentRepository.delete(request.id);
  }
}
