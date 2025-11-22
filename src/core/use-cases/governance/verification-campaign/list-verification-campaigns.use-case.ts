/**
 * List VerificationCampaigns Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationCampaignRepository } from "@/core/repositories/verification-campaign.repository.interface";
import type { VerificationCampaign } from "@/core/domain/entities/verification-campaign.entity";

export interface ListVerificationCampaignsRequest {
  activeOnly?: boolean;
  createdById?: string;
}

@injectable()
export class ListVerificationCampaignsUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationCampaignRepository)
    private campaignRepository: IVerificationCampaignRepository,
  ) {}

  async execute(
    request: ListVerificationCampaignsRequest,
  ): Promise<VerificationCampaign[]> {
    if (request.createdById) {
      return await this.campaignRepository.findByCreator(request.createdById);
    }

    if (request.activeOnly) {
      return await this.campaignRepository.findActive();
    }

    return await this.campaignRepository.findAll();
  }
}
