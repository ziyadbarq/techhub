/**
 * LicenseProductField Presenter
 * Transforms LicenseProductField entities to DTOs for the presentation layer
 */

import type { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import type { ValidationRules } from "@/core/domain/entities/field-definition.entity";

export interface LicenseProductFieldDTO {
  id: string;
  licenseProductId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isVisible: boolean;
  uiOrder: number;
  defaultValue: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enriched DTO with FieldDefinition details for UI rendering
 * Compatible with CustomFieldsSection component
 */
export interface EnrichedLicenseProductFieldDTO extends LicenseProductFieldDTO {
  // FieldDefinition properties
  fieldName: string;
  fieldLabel: string;
  fieldDescription: string | null;
  dataType: FieldDataTypeEnum;
  enumOptions: string[] | null;
  validationRules: ValidationRules | null;
  fieldDefaultValue: unknown;
  uiGroup: string | null;
}

/**
 * Input for creating enriched DTOs from repository with included FieldDefinition
 */
export interface LicenseProductFieldWithDefinition {
  id: string;
  licenseProductId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isVisible: boolean;
  uiOrder: number;
  defaultValue: unknown;
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

export class LicenseProductFieldPresenter {
  static toDTO(field: LicenseProductField): LicenseProductFieldDTO {
    return {
      id: field.id,
      licenseProductId: field.licenseProductId,
      fieldDefinitionId: field.fieldDefinitionId,
      isRequired: field.isRequired,
      isVisible: field.isVisible,
      uiOrder: field.uiOrder,
      defaultValue: field.defaultValue,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    };
  }

  static toDTOList(fields: LicenseProductField[]): LicenseProductFieldDTO[] {
    return fields.map((field) => this.toDTO(field));
  }

  /**
   * Convert to enriched DTO with FieldDefinition details
   */
  static toEnrichedDTO(
    field: LicenseProductFieldWithDefinition,
  ): EnrichedLicenseProductFieldDTO {
    return {
      id: field.id,
      licenseProductId: field.licenseProductId,
      fieldDefinitionId: field.fieldDefinitionId,
      isRequired: field.isRequired,
      isVisible: field.isVisible,
      uiOrder: field.uiOrder,
      defaultValue: field.defaultValue as Record<string, unknown> | null,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
      // FieldDefinition properties
      fieldName: field.fieldDefinition.name,
      fieldLabel: field.fieldDefinition.label,
      fieldDescription: field.fieldDefinition.description,
      dataType: field.fieldDefinition.dataType as FieldDataTypeEnum,
      enumOptions: field.fieldDefinition.enumOptions as string[] | null,
      validationRules: field.fieldDefinition
        .validationRules as ValidationRules | null,
      fieldDefaultValue: field.fieldDefinition.defaultValue,
      uiGroup: field.fieldDefinition.uiGroup,
    };
  }

  static toEnrichedDTOList(
    fields: LicenseProductFieldWithDefinition[],
  ): EnrichedLicenseProductFieldDTO[] {
    return fields.map((field) => this.toEnrichedDTO(field));
  }
}
