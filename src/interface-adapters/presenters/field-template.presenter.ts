/**
 * Field Template Presenter
 * Transforms Field Template domain entities into DTOs for the UI layer
 */

import type { FieldTemplate } from "@/core/domain/entities/field-template.entity";
import type { FieldTemplateItemProps } from "@/core/domain/entities/field-template.entity";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

export interface FieldTemplateItemDTO {
  id: string;
  fieldTemplateId: string;
  fieldDefinitionId: string | null;
  fieldName: string;
  fieldLabel: string;
  fieldDataType: FieldDataTypeEnum;
  description: string | null;
  isRequired: boolean;
  isUnique: boolean;
  validationRules: Record<string, unknown> | null;
  defaultValue: unknown;
  enumOptions: string[] | null;
  uiOrder: number;
  uiGroup: string | null;
  isSearchable: boolean;
  isFilterable: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface FieldTemplateDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  entityType: string;
  category: string | null;
  standard: string | null;
  isBuiltIn: boolean;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  items: FieldTemplateItemDTO[];
  itemCount: number;
}

export interface FieldTemplateSummaryDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  entityType: string;
  category: string | null;
  standard: string | null;
  isBuiltIn: boolean;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
}

function presentFieldTemplateItem(
  item: FieldTemplateItemProps,
): FieldTemplateItemDTO {
  return {
    id: item.id,
    fieldTemplateId: item.fieldTemplateId,
    fieldDefinitionId: item.fieldDefinitionId,
    fieldName: item.fieldName,
    fieldLabel: item.fieldLabel,
    fieldDataType: item.fieldDataType,
    description: item.description,
    isRequired: item.isRequired,
    isUnique: item.isUnique,
    validationRules: item.validationRules,
    defaultValue: item.defaultValue,
    enumOptions: item.enumOptions,
    uiOrder: item.uiOrder,
    uiGroup: item.uiGroup,
    isSearchable: item.isSearchable,
    isFilterable: item.isFilterable,
    metadata: item.metadata,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function presentFieldTemplate(
  template: FieldTemplate,
): FieldTemplateDTO {
  return {
    id: template.id,
    name: template.name,
    code: template.code,
    description: template.description,
    entityType: template.entityType,
    category: template.category,
    standard: template.standard,
    isBuiltIn: template.isBuiltIn,
    isActive: template.isActive,
    metadata: template.metadata,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    createdById: template.createdById,
    items: template.items.map(presentFieldTemplateItem),
    itemCount: template.itemCount,
  };
}

export function presentFieldTemplateSummary(
  template: FieldTemplate,
): FieldTemplateSummaryDTO {
  return {
    id: template.id,
    name: template.name,
    code: template.code,
    description: template.description,
    entityType: template.entityType,
    category: template.category,
    standard: template.standard,
    isBuiltIn: template.isBuiltIn,
    isActive: template.isActive,
    itemCount: template.itemCount,
    createdAt: template.createdAt.toISOString(),
  };
}

export function presentFieldTemplates(
  templates: FieldTemplate[],
): FieldTemplateDTO[] {
  return templates.map(presentFieldTemplate);
}

export function presentFieldTemplateSummaries(
  templates: FieldTemplate[],
): FieldTemplateSummaryDTO[] {
  return templates.map(presentFieldTemplateSummary);
}
