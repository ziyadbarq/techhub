/**
 * CI Class Field Presenter
 * Transforms CI Class Field entities to DTOs for the presentation layer
 */

import type { CIClassField } from "@/core/domain/entities/ci-class-field.entity";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import type { ValidationRules } from "@/core/domain/entities/field-definition.entity";
import type { CIClassFieldWithDefinition } from "@/core/repositories/ci-class-field.repository.interface";

export interface CIClassFieldDTO {
  id: string;
  ciClassId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isUnique: boolean;
  isVisible: boolean;
  defaultValue: Record<string, unknown> | null;
  uiOrder: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enriched DTO with FieldDefinition details for UI rendering
 * Compatible with CustomFieldsSection component
 */
export interface EnrichedCIClassFieldDTO extends CIClassFieldDTO {
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

export class CIClassFieldPresenter {
  static toDTO(ciClassField: CIClassField): CIClassFieldDTO {
    return {
      id: ciClassField.id,
      ciClassId: ciClassField.ciClassId,
      fieldDefinitionId: ciClassField.fieldDefinitionId,
      isRequired: ciClassField.isRequired,
      isUnique: ciClassField.isUnique,
      isVisible: ciClassField.isVisible,
      defaultValue: ciClassField.defaultValue,
      uiOrder: ciClassField.uiOrder,
      note: ciClassField.note,
      createdAt: ciClassField.createdAt,
      updatedAt: ciClassField.updatedAt,
    };
  }

  static toDTOList(ciClassFields: CIClassField[]): CIClassFieldDTO[] {
    return ciClassFields.map((ciClassField) => this.toDTO(ciClassField));
  }

  /**
   * Convert to enriched DTO with FieldDefinition details
   */
  static toEnrichedDTO(
    field: CIClassFieldWithDefinition,
  ): EnrichedCIClassFieldDTO {
    return {
      id: field.id,
      ciClassId: field.ciClassId,
      fieldDefinitionId: field.fieldDefinitionId,
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      isVisible: field.isVisible,
      defaultValue: field.defaultValue as Record<string, unknown> | null,
      uiOrder: field.uiOrder,
      note: field.note,
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
    fields: CIClassFieldWithDefinition[],
  ): EnrichedCIClassFieldDTO[] {
    return fields.map((field) => this.toEnrichedDTO(field));
  }
}
