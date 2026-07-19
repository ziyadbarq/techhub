/**
 * Delete AttachmentType Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentTypeRepository } from "@/core/repositories/attachment-type.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteAttachmentTypeRequest {
  id: string;
}

@injectable()
export class DeleteAttachmentTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentTypeRepository)
    private attachmentTypeRepository: IAttachmentTypeRepository,
  ) {}

  async execute(request: DeleteAttachmentTypeRequest): Promise<void> {
    // Check if attachment type exists
    const attachmentType = await this.attachmentTypeRepository.findById(
      request.id,
    );
    if (!attachmentType) {
      throw new NotFoundError("Attachment type not found");
    }

    await this.attachmentTypeRepository.delete(request.id);
  }
}
