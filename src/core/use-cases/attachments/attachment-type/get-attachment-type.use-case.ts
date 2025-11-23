/**
 * Get AttachmentType Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentTypeRepository } from "@/core/repositories/attachment-type.repository.interface";
import type { AttachmentType } from "@/core/domain/entities/attachment-type.entity";

export interface GetAttachmentTypeRequest {
  id: string;
}

@injectable()
export class GetAttachmentTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentTypeRepository)
    private attachmentTypeRepository: IAttachmentTypeRepository,
  ) {}

  async execute(request: GetAttachmentTypeRequest): Promise<AttachmentType> {
    const attachmentType = await this.attachmentTypeRepository.findById(
      request.id,
    );

    if (!attachmentType) {
      throw new Error("Attachment type not found");
    }

    return attachmentType;
  }
}
