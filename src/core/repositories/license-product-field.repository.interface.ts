/**
 * LicenseProductField Repository Interface
 *
 * Defines data access operations for LicenseProductField entities.
 */

import type { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

export interface LicenseProductFieldWithDefinition {
  id: string;
  licenseProductId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isUnique: boolean;
  isVisible: boolean;
  defaultValue: unknown;
  uiOrder: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  fieldDefinition: {
    id: string;
    name: string;
    label: string;
    description: string | null;
    dataType: FieldDataTypeEnum | string;
    enumOptions: unknown;
    validationRules: unknown;
    defaultValue: unknown;
    uiGroup: string | null;
  };
}

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
   * Finds all fields with FieldDefinition details for a license product
   */
  findByLicenseProductIdWithDefinition(
    licenseProductId: string,
  ): Promise<LicenseProductFieldWithDefinition[]>;

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
