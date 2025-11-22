/**
 * VerificationCampaign Presenter
 * Transforms VerificationCampaign entities to DTOs for the presentation layer
 */

import type { VerificationCampaign } from "@/core/domain/entities/verification-campaign.entity";

export interface VerificationCampaignDTO {
  id: string;
  name: string;
  description: string | null;
  targetType: string;
  filterDefinition: Record<string, unknown> | null;
  scheduledStart: Date;
  scheduledEnd: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  isActive: boolean;
  isCompleted: boolean;
  hasStarted: boolean;
}

export class VerificationCampaignPresenter {
  static toDTO(campaign: VerificationCampaign): VerificationCampaignDTO {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      targetType: campaign.targetType,
      filterDefinition: campaign.filterDefinition,
      scheduledStart: campaign.scheduledStart,
      scheduledEnd: campaign.scheduledEnd,
      createdById: campaign.createdById,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      // Computed fields
      isActive: campaign.isActive(),
      isCompleted: campaign.isCompleted(),
      hasStarted: campaign.hasStarted(),
    };
  }

  static toDTOList(
    campaigns: VerificationCampaign[],
  ): VerificationCampaignDTO[] {
    return campaigns.map((campaign) => this.toDTO(campaign));
  }
}
