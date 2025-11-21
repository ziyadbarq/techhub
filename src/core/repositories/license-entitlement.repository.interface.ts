/**
 * LicenseEntitlement Repository Interface
 */

import type { LicenseEntitlement } from "../domain/entities/license-entitlement.entity";

export interface ILicenseEntitlementRepository {
  /**
   * Create a new license entitlement
   */
  create(entitlement: LicenseEntitlement): Promise<LicenseEntitlement>;

  /**
   * Find a license entitlement by ID
   */
  findById(id: string): Promise<LicenseEntitlement | null>;

  /**
   * Find all license entitlements
   */
  findAll(): Promise<LicenseEntitlement[]>;

  /**
   * Find license entitlements by license product ID
   */
  findByLicenseProductId(
    licenseProductId: string,
  ): Promise<LicenseEntitlement[]>;

  /**
   * Find license entitlements by contract ID
   */
  findByContractId(contractId: string): Promise<LicenseEntitlement[]>;

  /**
   * Find active license entitlements for a license product
   */
  findActiveByLicenseProductId(
    licenseProductId: string,
    asOfDate?: Date,
  ): Promise<LicenseEntitlement[]>;

  /**
   * Find expired license entitlements
   */
  findExpired(asOfDate?: Date): Promise<LicenseEntitlement[]>;

  /**
   * Find license entitlements expiring within a date range
   */
  findExpiringBetween(
    startDate: Date,
    endDate: Date,
  ): Promise<LicenseEntitlement[]>;

  /**
   * Update a license entitlement
   */
  update(entitlement: LicenseEntitlement): Promise<LicenseEntitlement>;

  /**
   * Delete a license entitlement
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a license entitlement exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count license entitlements for a license product
   */
  countByLicenseProductId(licenseProductId: string): Promise<number>;
}
