/**
 * VerificationItem Repository Interface
 *
 * Defines data access operations for VerificationItem entities.
 */

import type { VerificationItem } from "@/core/domain/entities/verification-item.entity";
import type { VerificationStatusEnum } from "@/core/domain/entities/verification-item.entity";

export interface IVerificationItemRepository {
  /**
   * Creates a new verification item
   */
  create(verificationItem: VerificationItem): Promise<VerificationItem>;

  /**
   * Finds a verification item by ID
   */
  findById(id: string): Promise<VerificationItem | null>;

  /**
   * Finds all verification items
   */
  findAll(): Promise<VerificationItem[]>;

  /**
   * Finds verification items by campaign
   */
  findByCampaign(campaignId: string): Promise<VerificationItem[]>;

  /**
   * Finds verification items by status
   */
  findByStatus(status: VerificationStatusEnum): Promise<VerificationItem[]>;

  /**
   * Counts verification items by status
   */
  countByStatus(
    campaignId: string,
    status: VerificationStatusEnum,
  ): Promise<number>;

  /**
   * Updates an existing verification item
   */
  update(verificationItem: VerificationItem): Promise<VerificationItem>;

  /**
   * Deletes a verification item by ID
   */
  delete(id: string): Promise<void>;
}
