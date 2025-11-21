/**
 * LicenseAllocation Repository Interface
 */

import type {
  LicenseAllocation,
  AllocationTargetType,
} from "../domain/entities/license-allocation.entity";

export interface ILicenseAllocationRepository {
  /**
   * Create a new license allocation
   */
  create(allocation: LicenseAllocation): Promise<LicenseAllocation>;

  /**
   * Find a license allocation by ID
   */
  findById(id: string): Promise<LicenseAllocation | null>;

  /**
   * Find all license allocations
   */
  findAll(): Promise<LicenseAllocation[]>;

  /**
   * Find license allocations by license entitlement ID
   */
  findByLicenseEntitlementId(
    licenseEntitlementId: string,
  ): Promise<LicenseAllocation[]>;

  /**
   * Find active license allocations by license entitlement ID
   */
  findActiveByLicenseEntitlementId(
    licenseEntitlementId: string,
  ): Promise<LicenseAllocation[]>;

  /**
   * Find license allocations by target
   */
  findByTarget(
    targetType: AllocationTargetType,
    targetId: string,
  ): Promise<LicenseAllocation[]>;

  /**
   * Find active license allocations by target
   */
  findActiveByTarget(
    targetType: AllocationTargetType,
    targetId: string,
  ): Promise<LicenseAllocation[]>;

  /**
   * Calculate total allocated quantity for a license entitlement
   */
  sumAllocatedQuantityByEntitlement(
    licenseEntitlementId: string,
  ): Promise<number>;

  /**
   * Calculate total active allocated quantity for a license entitlement
   */
  sumActiveAllocatedQuantityByEntitlement(
    licenseEntitlementId: string,
  ): Promise<number>;

  /**
   * Update a license allocation
   */
  update(allocation: LicenseAllocation): Promise<LicenseAllocation>;

  /**
   * Delete a license allocation
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a license allocation exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count license allocations for a license entitlement
   */
  countByLicenseEntitlementId(licenseEntitlementId: string): Promise<number>;

  /**
   * Count active license allocations for a license entitlement
   */
  countActiveByLicenseEntitlementId(
    licenseEntitlementId: string,
  ): Promise<number>;
}
