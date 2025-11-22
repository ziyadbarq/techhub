/**
 * Get Attachments By Target Use Case
 *
 * Retrieves all attachments for a specific target (polymorphic)
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";
import type { Attachment } from "@/core/domain/entities/attachment.entity";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

export interface GetAttachmentsByTargetRequest {
  targetType: TargetObjectTypeEnum;
  targetId: string;
}

@injectable()
export class GetAttachmentsByTargetUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentRepository)
    private attachmentRepository: IAttachmentRepository,
  ) {}

  async execute(request: GetAttachmentsByTargetRequest): Promise<Attachment[]> {
    return await this.attachmentRepository.findByTarget(
      request.targetType,
      request.targetId,
    );
  }
}
