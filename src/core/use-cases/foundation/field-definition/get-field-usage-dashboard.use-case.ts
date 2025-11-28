/**
 * Get Field Usage Dashboard Use Case
 * Retrieves aggregated statistics for all field definitions
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  IFieldDefinitionRepository,
  FieldUsageStatistics,
} from "@/core/repositories/field-definition.repository.interface";
import type { FieldDefinition } from "@/core/domain/entities/field-definition.entity";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";

/**
 * Individual field with its usage statistics
 */
export interface FieldWithUsage {
  field: FieldDefinition;
  usage: FieldUsageStatistics;
}

/**
 * Data type distribution for charts
 */
export interface DataTypeDistribution {
  dataType: FieldDataTypeEnum;
  count: number;
  inUseCount: number;
}

/**
 * Overall dashboard statistics
 */
export interface FieldUsageDashboardData {
  /** Total number of field definitions */
  totalFields: number;
  /** Number of fields currently in use */
  fieldsInUse: number;
  /** Number of fields not being used */
  unusedFields: number;
  /** Total number of asset categories using custom fields */
  totalAssetCategoriesWithFields: number;
  /** Total number of CI classes using custom fields */
  totalCIClassesWithFields: number;
  /** Total number of license products using custom fields */
  totalLicenseProductsWithFields: number;
  /** Total number of assets with custom field values */
  totalAssetsWithValues: number;
  /** Total number of CIs with custom field values */
  totalCIsWithValues: number;
  /** Total number of license entitlements with custom field values */
  totalLicensesWithValues: number;
  /** Distribution by data type */
  dataTypeDistribution: DataTypeDistribution[];
  /** Top 10 most used fields */
  topUsedFields: FieldWithUsage[];
  /** Fields that are defined but unused */
  unusedFieldsList: FieldDefinition[];
  /** Fields that are archived */
  archivedFields: FieldDefinition[];
  /** All fields with their usage statistics */
  allFieldsWithUsage: FieldWithUsage[];
}

@injectable()
export class GetFieldUsageDashboardUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private readonly fieldDefinitionRepository: IFieldDefinitionRepository,
  ) {}

  async execute(): Promise<FieldUsageDashboardData> {
    // Fetch all fields including active, archived (but not deleted)
    const [activeFields, archivedFields] = await Promise.all([
      this.fieldDefinitionRepository.findAll({
        includeDeleted: false,
        includeArchived: true,
      }),
      this.fieldDefinitionRepository.findArchived(),
    ]);

    // Fetch usage statistics for all active fields
    const usagePromises = activeFields.map(async (field) => {
      const usage = await this.fieldDefinitionRepository.getUsageStatistics(
        field.id,
      );
      return { field, usage };
    });

    const allFieldsWithUsage = await Promise.all(usagePromises);

    // Calculate aggregates
    const totalFields = activeFields.length;
    const fieldsInUse = allFieldsWithUsage.filter(
      (f) => f.usage.isInUse,
    ).length;
    const unusedFields = totalFields - fieldsInUse;

    // Calculate unique entity counts
    const assetCategorySet = new Set<string>();
    const ciClassSet = new Set<string>();
    const licenseProductSet = new Set<string>();
    let totalAssetsWithValues = 0;
    let totalCIsWithValues = 0;
    let totalLicensesWithValues = 0;

    for (const { usage } of allFieldsWithUsage) {
      for (const cat of usage.usageDetails.assetCategories) {
        assetCategorySet.add(cat.id);
      }
      for (const cls of usage.usageDetails.ciClasses) {
        ciClassSet.add(cls.id);
      }
      for (const prod of usage.usageDetails.licenseProducts) {
        licenseProductSet.add(prod.id);
      }
      totalAssetsWithValues += usage.assetValueCount;
      totalCIsWithValues += usage.ciValueCount;
      totalLicensesWithValues += usage.licenseValueCount;
    }

    // Calculate data type distribution
    const dataTypeMap = new Map<
      FieldDataTypeEnum,
      { count: number; inUseCount: number }
    >();
    for (const { field, usage } of allFieldsWithUsage) {
      const existing = dataTypeMap.get(field.dataType) || {
        count: 0,
        inUseCount: 0,
      };
      dataTypeMap.set(field.dataType, {
        count: existing.count + 1,
        inUseCount: existing.inUseCount + (usage.isInUse ? 1 : 0),
      });
    }

    const dataTypeDistribution: DataTypeDistribution[] = Array.from(
      dataTypeMap.entries(),
    )
      .map(([dataType, data]) => ({
        dataType,
        count: data.count,
        inUseCount: data.inUseCount,
      }))
      .sort((a, b) => b.count - a.count);

    // Top 10 most used fields (by total usage count)
    const topUsedFields = [...allFieldsWithUsage]
      .filter((f) => f.usage.isInUse)
      .sort((a, b) => b.usage.totalUsageCount - a.usage.totalUsageCount)
      .slice(0, 10);

    // Unused fields list
    const unusedFieldsList = allFieldsWithUsage
      .filter((f) => !f.usage.isInUse)
      .map((f) => f.field);

    return {
      totalFields,
      fieldsInUse,
      unusedFields,
      totalAssetCategoriesWithFields: assetCategorySet.size,
      totalCIClassesWithFields: ciClassSet.size,
      totalLicenseProductsWithFields: licenseProductSet.size,
      totalAssetsWithValues,
      totalCIsWithValues,
      totalLicensesWithValues,
      dataTypeDistribution,
      topUsedFields,
      unusedFieldsList,
      archivedFields,
      allFieldsWithUsage,
    };
  }
}
