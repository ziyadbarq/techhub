/**
 * IVendorRepository Interface
 * Data access contract for vendors
 */

import type { Vendor } from "../domain/entities/vendor.entity";

export interface IVendorRepository {
  /**
   * Create a new vendor
   */
  create(vendor: Vendor): Promise<Vendor>;

  /**
   * Find vendor by ID
   */
  findById(id: string): Promise<Vendor | null>;

  /**
   * Find vendor by name
   */
  findByName(name: string): Promise<Vendor | null>;

  /**
   * Find vendor by code
   */
  findByCode(code: string): Promise<Vendor | null>;

  /**
   * Find vendors by codes (batch lookup for import)
   * Used for duplicate detection in data import
   */
  findByCodes(codes: string[]): Promise<Vendor[]>;

  /**
   * Find vendor by email
   */
  findByEmail(email: string): Promise<Vendor | null>;

  /**
   * Find all vendors
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<Vendor[]>;

  /**
   * Search vendors by name
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<Vendor[]>;

  /**
   * Count all vendors
   */
  count(): Promise<number>;

  /**
   * Update vendor
   */
  update(vendor: Vendor): Promise<Vendor>;

  /**
   * Delete vendor
   */
  delete(id: string): Promise<void>;

  /**
   * Check if vendor has assets
   */
  hasAssets(id: string): Promise<boolean>;

  /**
   * Check if vendor has contacts
   */
  hasContacts(id: string): Promise<boolean>;

  /**
   * Check if vendor has contracts
   */
  hasContracts(id: string): Promise<boolean>;

  /**
   * Check if vendor has license products
   */
  hasLicenseProducts(id: string): Promise<boolean>;

  /**
   * Check if name exists (for uniqueness validation)
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if email exists (for uniqueness validation)
   */
  existsByEmail(email: string, excludeId?: string): Promise<boolean>;
}
