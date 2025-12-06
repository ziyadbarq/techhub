/**
 * Two-Factor Authentication Repository Interface
 *
 * Defines data access operations for 2FA configuration.
 *
 * Layer: Core (Repository Interface)
 * Implementation: Infrastructure Layer (Prisma)
 */

import type { TwoFactorConfig } from "@/core/domain/entities/two-factor-config.entity";

export interface ITwoFactorRepository {
  /**
   * Find 2FA configuration by user ID
   *
   * @param userId - User ID to lookup
   * @returns TwoFactorConfig if exists, null otherwise
   */
  findByUserId(userId: string): Promise<TwoFactorConfig | null>;

  /**
   * Create new 2FA configuration
   *
   * @param config - Two-factor configuration entity
   * @returns Created configuration with ID
   */
  create(config: TwoFactorConfig): Promise<TwoFactorConfig>;

  /**
   * Update existing 2FA configuration
   *
   * @param config - Updated configuration entity
   * @returns Updated configuration
   */
  update(config: TwoFactorConfig): Promise<TwoFactorConfig>;

  /**
   * Delete 2FA configuration for user
   *
   * @param userId - User ID to remove configuration for
   * @returns True if deleted, false if not found
   */
  delete(userId: string): Promise<boolean>;

  /**
   * Check if user has 2FA enabled
   *
   * @param userId - User ID to check
   * @returns True if 2FA configuration exists
   */
  exists(userId: string): Promise<boolean>;
}
