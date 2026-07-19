/**
 * Complete VerificationCampaign Use Case
 *
 * Completes a campaign by setting the scheduled end date to now.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationCampaignRepository } from "@/core/repositories/verification-campaign.repository.interface";
import type { VerificationCampaign } from "@/core/domain/entities/verification-campaign.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CompleteVerificationCampaignRequest {
  id: string;
}

@injectable()
export class CompleteVerificationCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationCampaignRepository)
    private campaignRepository: IVerificationCampaignRepository,
  ) {}

  async execute(
    request: CompleteVerificationCampaignRequest,
  ): Promise<VerificationCampaign> {
    // Fetch existing verification campaign
    const campaign = await this.campaignRepository.findById(request.id);

    if (!campaign) {
      throw new NotFoundError("Verification campaign not found");
    }

    // Complete the campaign (sets scheduledEnd to now)
    campaign.complete();

    return await this.campaignRepository.update(campaign);
  }
}
