/**
 * Field Definition Presenter
 * Transforms Field Definition domain entities into DTOs for the UI layer
 */

import type { FieldDefinition } from "@/core/domain/entities/field-definition.entity";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

export interface FieldDefinitionDTO {
  id: string;
  name: string;
  label: string;
  description: string | null;
  dataType: FieldDataTypeEnum;
  entityType: string;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue: unknown;
  validationRules: Record<string, unknown> | null;
  displayOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentFieldDefinition(
  field: FieldDefinition,
): FieldDefinitionDTO {
  return {
    id: field.id,
    name: field.name,
    label: field.label,
    description: field.description,
    dataType: field.dataType,
    entityType: field.entityType,
    isRequired: field.isRequired,
    isUnique: field.isUnique,
    defaultValue: field.defaultValue,
    validationRules: field.validationRules,
    displayOrder: field.displayOrder,
    isActive: field.isActive,
    metadata: field.metadata,
    createdAt: field.createdAt.toISOString(),
    updatedAt: field.updatedAt.toISOString(),
  };
}

export function presentFieldDefinitions(
  fields: FieldDefinition[],
): FieldDefinitionDTO[] {
  return fields.map(presentFieldDefinition);
}
