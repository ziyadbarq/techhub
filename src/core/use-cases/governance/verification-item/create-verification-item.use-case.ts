/**
 * Create VerificationItem Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationItemRepository } from "@/core/repositories/verification-item.repository.interface";
import {
  VerificationItem,
  type VerificationStatusEnum,
} from "@/core/domain/entities/verification-item.entity";
import type { TargetObjectTypeEnum } from "@/generated/prisma";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateVerificationItemRequest {
  verificationCampaignId: string;
  targetType: TargetObjectTypeEnum;
  targetId: string;
  verifierPersonId?: string | null;
  status?: VerificationStatusEnum;
  verifiedAt?: Date | null;
  comment?: string | null;
}

@injectable()
export class CreateVerificationItemUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationItemRepository)
    private verificationItemRepository: IVerificationItemRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: CreateVerificationItemRequest,
  ): Promise<VerificationItem> {
    // Create verification item entity
    const verificationItem = VerificationItem.create(
      {
        verificationCampaignId: request.verificationCampaignId,
        targetType: request.targetType,
        targetId: request.targetId,
        verifierPersonId: request.verifierPersonId,
        status: request.status,
        verifiedAt: request.verifiedAt,
        comment: request.comment,
      },
      this.idGenerator,
    );

    return await this.verificationItemRepository.create(verificationItem);
  }
}
