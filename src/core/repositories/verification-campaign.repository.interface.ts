/**
 * VerificationCampaign Repository Interface
 *
 * Defines data access operations for VerificationCampaign entities.
 */

import type { VerificationCampaign } from "@/core/domain/entities/verification-campaign.entity";

export interface IVerificationCampaignRepository {
  /**
   * Creates a new verification campaign
   */
  create(campaign: VerificationCampaign): Promise<VerificationCampaign>;

  /**
   * Finds a verification campaign by ID
   */
  findById(id: string): Promise<VerificationCampaign | null>;

  /**
   * Finds all verification campaigns
   */
  findAll(): Promise<VerificationCampaign[]>;

  /**
   * Finds active verification campaigns (within scheduled date range)
   */
  findActive(asOfDate?: Date): Promise<VerificationCampaign[]>;

  /**
   * Finds verification campaigns created by a specific person
   */
  findByCreator(createdById: string): Promise<VerificationCampaign[]>;

  /**
   * Updates an existing verification campaign
   */
  update(campaign: VerificationCampaign): Promise<VerificationCampaign>;

  /**
   * Deletes a verification campaign by ID
   */
  delete(id: string): Promise<void>;
}
