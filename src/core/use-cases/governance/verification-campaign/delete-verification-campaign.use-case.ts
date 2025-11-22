/**
 * Delete VerificationCampaign Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationCampaignRepository } from "@/core/repositories/verification-campaign.repository.interface";

export interface DeleteVerificationCampaignRequest {
  id: string;
}

@injectable()
export class DeleteVerificationCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationCampaignRepository)
    private campaignRepository: IVerificationCampaignRepository,
  ) {}

  async execute(request: DeleteVerificationCampaignRequest): Promise<void> {
    // Verify campaign exists
    const campaign = await this.campaignRepository.findById(request.id);

    if (!campaign) {
      throw new Error("Verification campaign not found");
    }

    await this.campaignRepository.delete(request.id);
  }
}
