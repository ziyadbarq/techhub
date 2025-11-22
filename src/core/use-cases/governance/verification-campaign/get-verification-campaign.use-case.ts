/**
 * Get VerificationCampaign Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationCampaignRepository } from "@/core/repositories/verification-campaign.repository.interface";
import type { VerificationCampaign } from "@/core/domain/entities/verification-campaign.entity";

export interface GetVerificationCampaignRequest {
  id: string;
}

@injectable()
export class GetVerificationCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationCampaignRepository)
    private campaignRepository: IVerificationCampaignRepository,
  ) {}

  async execute(
    request: GetVerificationCampaignRequest,
  ): Promise<VerificationCampaign> {
    const campaign = await this.campaignRepository.findById(request.id);

    if (!campaign) {
      throw new Error("Verification campaign not found");
    }

    return campaign;
  }
}
