/**
 * LicenseProductField Repository Interface
 *
 * Defines data access operations for LicenseProductField entities.
 */

import type { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";

export interface ILicenseProductFieldRepository {
  /**
   * Creates a new license product field
   */
  create(field: LicenseProductField): Promise<LicenseProductField>;

  /**
   * Finds a license product field by ID
   */
  findById(id: string): Promise<LicenseProductField | null>;

  /**
   * Finds all fields for a license product
   */
  findByLicenseProductId(
    licenseProductId: string,
  ): Promise<LicenseProductField[]>;

  /**
   * Finds a field by license product and field definition
   */
  findByLicenseProductAndFieldDefinition(
    licenseProductId: string,
    fieldDefinitionId: string,
  ): Promise<LicenseProductField | null>;

  /**
   * Updates an existing license product field
   */
  update(field: LicenseProductField): Promise<LicenseProductField>;

  /**
   * Deletes a license product field by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a field exists for a license product and field definition
   */
  exists(licenseProductId: string, fieldDefinitionId: string): Promise<boolean>;
}
