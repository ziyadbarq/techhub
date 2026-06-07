/**
 * Field Definition Presenter
 * Transforms Field Definition domain entities into DTOs for the UI layer
 */

import type {
  FieldDefinition,
  FieldConditionalLogic,
} from "@/core/domain/entities/field-definition.entity";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import type {
  FieldUsageDashboardData,
  FieldWithUsage,
  DataTypeDistribution,
} from "@/core/use-cases/foundation/field-definition";

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
  enumOptions: string[] | null;
  conditionalLogic: FieldConditionalLogic | null;
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
    enumOptions: field.enumOptions,
    conditionalLogic: field.conditionalLogic,
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

// ==========================================
// Field Usage Dashboard DTOs
// ==========================================

export interface FieldWithUsageDTO {
  field: FieldDefinitionDTO;
  usage: {
    isInUse: boolean;
    assetCategoryCount: number;
    ciClassCount: number;
    licenseProductCount: number;
    assetValueCount: number;
    ciValueCount: number;
    licenseValueCount: number;
    totalUsageCount: number;
    usageDetails: {
      assetCategories: Array<{ id: string; name: string }>;
      ciClasses: Array<{ id: string; name: string }>;
      licenseProducts: Array<{ id: string; name: string }>;
    };
  };
}

export interface DataTypeDistributionDTO {
  dataType: FieldDataTypeEnum;
  count: number;
  inUseCount: number;
}

export interface FieldUsageDashboardDTO {
  totalFields: number;
  fieldsInUse: number;
  unusedFields: number;
  totalAssetCategoriesWithFields: number;
  totalCIClassesWithFields: number;
  totalLicenseProductsWithFields: number;
  totalAssetsWithValues: number;
  totalCIsWithValues: number;
  totalLicensesWithValues: number;
  dataTypeDistribution: DataTypeDistributionDTO[];
  topUsedFields: FieldWithUsageDTO[];
  unusedFieldsList: FieldDefinitionDTO[];
  archivedFields: FieldDefinitionDTO[];
}

function presentFieldWithUsage(
  fieldWithUsage: FieldWithUsage,
): FieldWithUsageDTO {
  return {
    field: presentFieldDefinition(fieldWithUsage.field),
    usage: fieldWithUsage.usage,
  };
}

export function presentFieldUsageDashboard(
  data: FieldUsageDashboardData,
): FieldUsageDashboardDTO {
  return {
    totalFields: data.totalFields,
    fieldsInUse: data.fieldsInUse,
    unusedFields: data.unusedFields,
    totalAssetCategoriesWithFields: data.totalAssetCategoriesWithFields,
    totalCIClassesWithFields: data.totalCIClassesWithFields,
    totalLicenseProductsWithFields: data.totalLicenseProductsWithFields,
    totalAssetsWithValues: data.totalAssetsWithValues,
    totalCIsWithValues: data.totalCIsWithValues,
    totalLicensesWithValues: data.totalLicensesWithValues,
    dataTypeDistribution: data.dataTypeDistribution.map(
      (item: DataTypeDistribution) => ({
        dataType: item.dataType,
        count: item.count,
        inUseCount: item.inUseCount,
      }),
    ),
    topUsedFields: data.topUsedFields.map(presentFieldWithUsage),
    unusedFieldsList: presentFieldDefinitions(data.unusedFieldsList),
    archivedFields: presentFieldDefinitions(data.archivedFields),
  };
}
