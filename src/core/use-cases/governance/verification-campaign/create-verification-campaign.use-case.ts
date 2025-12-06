/**
 * Create VerificationCampaign Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationCampaignRepository } from "@/core/repositories/verification-campaign.repository.interface";
import { VerificationCampaign } from "@/core/domain/entities/verification-campaign.entity";
import type { TargetObjectTypeEnum } from "@/core/domain/entities/verification-campaign.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateVerificationCampaignRequest {
  name: string;
  description?: string | null;
  targetType: TargetObjectTypeEnum;
  filterDefinition?: Record<string, unknown> | null;
  scheduledStart: Date;
  scheduledEnd?: Date | null;
  createdById: string;
}

@injectable()
export class CreateVerificationCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationCampaignRepository)
    private campaignRepository: IVerificationCampaignRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: CreateVerificationCampaignRequest,
  ): Promise<VerificationCampaign> {
    // Create verification campaign entity
    const campaign = VerificationCampaign.create(
      {
        name: request.name,
        description: request.description,
        targetType: request.targetType,
        filterDefinition: request.filterDefinition,
        scheduledStart: request.scheduledStart,
        scheduledEnd: request.scheduledEnd,
        createdById: request.createdById,
      },
      this.idGenerator,
    );

    return await this.campaignRepository.create(campaign);
  }
}
