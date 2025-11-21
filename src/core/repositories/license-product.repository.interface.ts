/**
 * LicenseProduct Repository Interface
 *
 * Defines data access operations for LicenseProduct entities.
 */

import type { LicenseProduct } from "@/core/domain/entities/license-product.entity";

export interface ILicenseProductRepository {
  /**
   * Creates a new license product
   */
  create(licenseProduct: LicenseProduct): Promise<LicenseProduct>;

  /**
   * Finds a license product by ID
   */
  findById(id: string): Promise<LicenseProduct | null>;

  /**
   * Finds a license product by name
   */
  findByName(name: string): Promise<LicenseProduct | null>;

  /**
   * Finds a license product by code
   */
  findByCode(code: string): Promise<LicenseProduct | null>;

  /**
   * Finds all license products
   */
  findAll(): Promise<LicenseProduct[]>;

  /**
   * Finds license products by vendor ID
   */
  findByVendorId(vendorId: string): Promise<LicenseProduct[]>;

  /**
   * Updates an existing license product
   */
  update(licenseProduct: LicenseProduct): Promise<LicenseProduct>;

  /**
   * Deletes a license product by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a license product exists by name
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Checks if a license product exists by code
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
