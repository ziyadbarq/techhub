/**
 * LicenseAddon Repository Interface
 *
 * Defines data access operations for LicenseAddon entities.
 */

import type { LicenseAddon } from "@/core/domain/entities/license-addon.entity";

export interface ILicenseAddonRepository {
  /**
   * Creates a new license addon
   */
  create(addon: LicenseAddon): Promise<LicenseAddon>;

  /**
   * Finds a license addon by ID
   */
  findById(id: string): Promise<LicenseAddon | null>;

  /**
   * Finds a license addon by code within a product
   */
  findByCode(
    licenseProductId: string,
    code: string,
  ): Promise<LicenseAddon | null>;

  /**
   * Finds all addons for a license product
   */
  findByLicenseProductId(licenseProductId: string): Promise<LicenseAddon[]>;

  /**
   * Finds active addons for a license product
   */
  findActiveByLicenseProductId(
    licenseProductId: string,
  ): Promise<LicenseAddon[]>;

  /**
   * Finds all license addons
   */
  findAll(): Promise<LicenseAddon[]>;

  /**
   * Updates an existing license addon
   */
  update(addon: LicenseAddon): Promise<LicenseAddon>;

  /**
   * Deletes a license addon by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if an addon code exists for a product
   */
  existsByCode(
    licenseProductId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Counts addons for a license product
   */
  countByLicenseProductId(licenseProductId: string): Promise<number>;
}
