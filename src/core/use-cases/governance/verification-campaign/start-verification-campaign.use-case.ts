/**
 * Start VerificationCampaign Use Case
 *
 * Starts a campaign by updating the scheduled start date to now.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationCampaignRepository } from "@/core/repositories/verification-campaign.repository.interface";
import type { VerificationCampaign } from "@/core/domain/entities/verification-campaign.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface StartVerificationCampaignRequest {
  id: string;
}

@injectable()
export class StartVerificationCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationCampaignRepository)
    private campaignRepository: IVerificationCampaignRepository,
  ) {}

  async execute(
    request: StartVerificationCampaignRequest,
  ): Promise<VerificationCampaign> {
    // Fetch existing verification campaign
    const campaign = await this.campaignRepository.findById(request.id);

    if (!campaign) {
      throw new NotFoundError("Verification campaign not found");
    }

    // Start the campaign (sets scheduledStart to now)
    campaign.start();

    return await this.campaignRepository.update(campaign);
  }
}
