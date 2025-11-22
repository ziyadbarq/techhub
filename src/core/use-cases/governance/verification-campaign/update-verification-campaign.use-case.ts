/**
 * Update VerificationCampaign Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IVerificationCampaignRepository } from "@/core/repositories/verification-campaign.repository.interface";
import type { VerificationCampaign } from "@/core/domain/entities/verification-campaign.entity";

export interface UpdateVerificationCampaignRequest {
  id: string;
  name?: string;
  description?: string | null;
  filterDefinition?: Record<string, unknown> | null;
  scheduledStart?: Date;
  scheduledEnd?: Date | null;
}

@injectable()
export class UpdateVerificationCampaignUseCase {
  constructor(
    @inject(DI_TOKENS.IVerificationCampaignRepository)
    private campaignRepository: IVerificationCampaignRepository,
  ) {}

  async execute(
    request: UpdateVerificationCampaignRequest,
  ): Promise<VerificationCampaign> {
    // Fetch existing verification campaign
    const campaign = await this.campaignRepository.findById(request.id);

    if (!campaign) {
      throw new Error("Verification campaign not found");
    }

    // Update fields
    if (request.name !== undefined) {
      campaign.name = request.name;
    }

    if (request.description !== undefined) {
      campaign.description = request.description;
    }

    if (request.filterDefinition !== undefined) {
      campaign.filterDefinition = request.filterDefinition;
    }

    // Update schedule if provided
    if (request.scheduledStart !== undefined || request.scheduledEnd !== undefined) {
      const newStart = request.scheduledStart ?? campaign.scheduledStart;
      const newEnd = request.scheduledEnd !== undefined ? request.scheduledEnd : campaign.scheduledEnd;
      campaign.updateSchedule(newStart, newEnd);
    }

    return await this.campaignRepository.update(campaign);
  }
}
