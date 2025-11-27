/**
 * LicenseEntitlementAddon Repository Interface
 *
 * Defines data access operations for LicenseEntitlementAddon entities.
 */

import type { LicenseEntitlementAddon } from "@/core/domain/entities/license-entitlement-addon.entity";

export interface CostAggregation {
  currency: string;
  total: number;
}

export interface ILicenseEntitlementAddonRepository {
  /**
   * Creates a new entitlement addon attachment
   */
  create(
    entitlementAddon: LicenseEntitlementAddon,
  ): Promise<LicenseEntitlementAddon>;

  /**
   * Finds an entitlement addon by ID
   */
  findById(id: string): Promise<LicenseEntitlementAddon | null>;

  /**
   * Finds entitlement addon by entitlement and addon IDs
   */
  findByEntitlementAndAddon(
    licenseEntitlementId: string,
    licenseAddonId: string,
  ): Promise<LicenseEntitlementAddon | null>;

  /**
   * Finds all addons attached to an entitlement
   */
  findByEntitlementId(
    licenseEntitlementId: string,
  ): Promise<LicenseEntitlementAddon[]>;

  /**
   * Finds all entitlements that have a specific addon attached
   */
  findByAddonId(licenseAddonId: string): Promise<LicenseEntitlementAddon[]>;

  /**
   * Finds all entitlement addons
   */
  findAll(): Promise<LicenseEntitlementAddon[]>;

  /**
   * Updates an existing entitlement addon
   */
  update(
    entitlementAddon: LicenseEntitlementAddon,
  ): Promise<LicenseEntitlementAddon>;

  /**
   * Deletes an entitlement addon by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Deletes all addon attachments for an entitlement
   */
  deleteByEntitlementId(licenseEntitlementId: string): Promise<void>;

  /**
   * Checks if an addon is attached to an entitlement
   */
  exists(
    licenseEntitlementId: string,
    licenseAddonId: string,
  ): Promise<boolean>;

  /**
   * Counts addons attached to an entitlement
   */
  countByEntitlementId(licenseEntitlementId: string): Promise<number>;

  /**
   * Aggregates addon costs by entitlement, grouped by currency
   * Returns array of { currency, total } for each currency used
   */
  sumCostByEntitlementId(
    licenseEntitlementId: string,
  ): Promise<CostAggregation[]>;

  /**
   * Aggregates addon costs by addon, grouped by currency
   * Returns array of { currency, total } for each currency used
   */
  sumCostByAddonId(licenseAddonId: string): Promise<CostAggregation[]>;
}
