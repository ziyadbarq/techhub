/**
 * Warranty Repository Interface
 * Defines data access patterns for Warranty entities
 */

import type { Warranty } from "../domain/entities/warranty.entity";
import type { WarrantyCoverageType } from "@/generated/prisma";

export interface WarrantySearchOptions {
  assetId?: string;
  vendorId?: string;
  coverageType?: WarrantyCoverageType;
  status?: "active" | "expired" | "future" | "expiring_soon"; // Warranty status
  expiringInDays?: number; // Find warranties expiring in N days
  searchTerm?: string; // Search in policyReference, coverageDetails, note
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface IWarrantyRepository {
  /**
   * Create a new warranty
   */
  create(warranty: Warranty): Promise<Warranty>;

  /**
   * Find warranty by ID
   */
  findById(id: string): Promise<Warranty | null>;

  /**
   * Find all warranties for a specific asset
   */
  findByAssetId(assetId: string): Promise<Warranty[]>;

  /**
   * Find currently active warranty for an asset
   * Returns the warranty that covers the current date
   */
  findActiveByAssetId(assetId: string): Promise<Warranty | null>;

  /**
   * Find all active warranties for an asset
   * (Multiple warranties can be active if they overlap)
   */
  findAllActiveByAssetId(assetId: string): Promise<Warranty[]>;

  /**
   * Find warranties expiring within specified days
   * Used for expiration notifications
   */
  findExpiringSoon(days: number): Promise<Warranty[]>;

  /**
   * Find all warranties by vendor
   */
  findByVendor(vendorId: string): Promise<Warranty[]>;

  /**
   * Find warranty by policy reference
   */
  findByPolicyReference(policyReference: string): Promise<Warranty | null>;

  /**
   * Find all warranties by coverage type
   */
  findByCoverageType(coverageType: WarrantyCoverageType): Promise<Warranty[]>;

  /**
   * Find all warranties (with pagination)
   */
  findAll(limit?: number, offset?: number): Promise<Warranty[]>;

  /**
   * Search warranties with advanced filters
   */
  search(options: WarrantySearchOptions): Promise<Warranty[]>;

  /**
   * Count total warranties
   */
  count(): Promise<number>;

  /**
   * Count warranties by search criteria
   */
  countBySearch(options: WarrantySearchOptions): Promise<number>;

  /**
   * Count active warranties
   */
  countActive(): Promise<number>;

  /**
   * Count warranties expiring soon
   */
  countExpiringSoon(days: number): Promise<number>;

  /**
   * Update an existing warranty
   */
  update(warranty: Warranty): Promise<Warranty>;

  /**
   * Delete a warranty
   */
  delete(id: string): Promise<void>;

  /**
   * Check if policy reference exists
   */
  existsByPolicyReference(
    policyReference: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Check if asset has warranties
   */
  assetHasWarranties(assetId: string): Promise<boolean>;

  /**
   * Check if warranty dates conflict with existing warranties for the same asset
   * Used to prevent overlapping warranties
   */
  hasConflictingWarranty(
    assetId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ): Promise<boolean>;
}
