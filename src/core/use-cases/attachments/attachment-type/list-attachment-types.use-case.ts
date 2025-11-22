/**
 * List AttachmentTypes Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentTypeRepository } from "@/core/repositories/attachment-type.repository.interface";
import { AttachmentType } from "@/core/domain/entities/attachment-type.entity";

export interface ListAttachmentTypesRequest {
  activeOnly?: boolean;
}

@injectable()
export class ListAttachmentTypesUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentTypeRepository)
    private attachmentTypeRepository: IAttachmentTypeRepository,
  ) {}

  async execute(
    request: ListAttachmentTypesRequest,
  ): Promise<AttachmentType[]> {
    if (request.activeOnly) {
      return await this.attachmentTypeRepository.findActive();
    }

    return await this.attachmentTypeRepository.findAll();
  }
}
