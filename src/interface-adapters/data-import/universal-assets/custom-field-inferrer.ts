/**
 * Custom Field Inferrer for Universal Assets Importer
 *
 * Handles the inference and creation of FieldDefinitions from custom.* columns.
 * Infers data type from sample values and creates FieldDefinitions + AssetCategoryFields.
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import type { ILoggerService } from "@/core/services";
import { FieldDefinition } from "@/core/domain/entities/field-definition.entity";
import { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";
import { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import type { GroupedRowData, InferredFieldDefinition } from "./types";
import { generateFieldLabel } from "./prefix-parser";

/**
 * Infer data type from a set of sample values
 */
export function inferDataType(values: unknown[]): FieldDataTypeEnum {
  // Filter out null/undefined/empty values
  const nonEmpty = values
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
    .map((v) => String(v).trim());

  if (nonEmpty.length === 0) {
    return FieldDataTypeEnum.STRING;
  }

  // Check for boolean (most restrictive)
  const booleanPatterns = ["true", "false", "yes", "no", "1", "0"];
  if (nonEmpty.every((v) => booleanPatterns.includes(v.toLowerCase()))) {
    return FieldDataTypeEnum.BOOLEAN;
  }

  // Check for integer
  if (nonEmpty.every((v) => /^-?\d+$/.test(v))) {
    return FieldDataTypeEnum.INTEGER;
  }

  // Check for decimal
  if (nonEmpty.every((v) => /^-?\d+\.?\d*$/.test(v))) {
    return FieldDataTypeEnum.DECIMAL;
  }

  // Check for date (multiple formats)
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // ISO: 2024-01-15
    /^\d{2}\/\d{2}\/\d{4}$/, // US: 01/15/2024
    /^\d{2}-\d{2}-\d{4}$/, // EU: 15-01-2024
    /^\d{4}\/\d{2}\/\d{2}$/, // JP: 2024/01/15
    /^\d{1,2}\/\d{1,2}\/\d{2}$/, // Short year: 1/15/24, 01/15/24
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime: 2024-01-15T10:30:00
    /^\d{2}-[A-Za-z]{3}-\d{4}$/, // DD-MMM-YYYY: 15-Jan-2024
    /^\d{4}\.\d{2}\.\d{2}$/, // ISO with dots: 2024.01.15
  ];
  if (nonEmpty.every((v) => datePatterns.some((p) => p.test(v)))) {
    return FieldDataTypeEnum.DATE;
  }

  // Default to string
  return FieldDataTypeEnum.STRING;
}

/**
 * Custom Field Inferrer class
 */
export class CustomFieldInferrer {
  private logger: ILoggerService;
  private createdFieldDefinitions: InferredFieldDefinition[] = [];
  private fieldDefinitionCache: Map<string, string> = new Map();

  constructor() {
    const container = getContainer();
    this.logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  }

  /**
   * Get created field definitions for reporting
   */
  getCreatedFieldDefinitions(): InferredFieldDefinition[] {
    return this.createdFieldDefinitions;
  }

  /**
   * Pre-load existing field definitions into cache
   */
  async preloadCache(): Promise<void> {
    const container = getContainer();
    const fieldDefRepo = container.get<IFieldDefinitionRepository>(
      DI_TOKENS.IFieldDefinitionRepository,
    );

    const existingFields = await fieldDefRepo.findAll();
    for (const field of existingFields) {
      this.fieldDefinitionCache.set(field.name.toLowerCase(), field.id);
    }

    this.logger.info("Field definition cache preloaded", {
      count: existingFields.length,
    });
  }

  /**
   * Analyze all rows to extract custom field data and infer types
   */
  analyzeCustomFields(
    rows: Array<{ data: GroupedRowData }>,
    _categoryCode: string,
    _categoryId: string,
  ): Map<string, InferredFieldDefinition> {
    // Collect all values for each custom field
    const fieldValues = new Map<string, unknown[]>();

    for (const row of rows) {
      for (const [fieldName, value] of Object.entries(row.data.custom)) {
        if (!fieldValues.has(fieldName)) {
          fieldValues.set(fieldName, []);
        }
        fieldValues.get(fieldName)!.push(value);
      }
    }

    // Infer types for each field
    const inferredFields = new Map<string, InferredFieldDefinition>();

    for (const [fieldName, values] of fieldValues) {
      const dataType = inferDataType(values);
      inferredFields.set(fieldName, {
        name: fieldName,
        label: generateFieldLabel(fieldName),
        dataType,
        sampleValues: values.slice(0, 5), // Keep first 5 samples
      });
    }

    return inferredFields;
  }

  /**
   * Create or resolve field definitions for a category
   */
  async resolveOrCreateFieldDefinitions(
    inferredFields: Map<string, InferredFieldDefinition>,
    categoryCode: string,
    categoryId: string,
  ): Promise<Map<string, string>> {
    const fieldIdMap = new Map<string, string>();
    const container = getContainer();
    const fieldDefRepo = container.get<IFieldDefinitionRepository>(
      DI_TOKENS.IFieldDefinitionRepository,
    );
    const categoryFieldRepo = container.get<IAssetCategoryFieldRepository>(
      DI_TOKENS.IAssetCategoryFieldRepository,
    );

    for (const [fieldName, inferred] of inferredFields) {
      const cacheKey = fieldName.toLowerCase();

      // Check cache first
      if (this.fieldDefinitionCache.has(cacheKey)) {
        const existingId = this.fieldDefinitionCache.get(cacheKey)!;
        fieldIdMap.set(fieldName, existingId);

        // Ensure it's linked to the category
        await this.ensureCategoryFieldLink(
          categoryFieldRepo,
          categoryId,
          existingId,
        );
        continue;
      }

      // Check database
      const existingDef = await fieldDefRepo.findByName(fieldName);
      if (existingDef) {
        this.fieldDefinitionCache.set(cacheKey, existingDef.id);
        fieldIdMap.set(fieldName, existingDef.id);

        // Ensure it's linked to the category
        await this.ensureCategoryFieldLink(
          categoryFieldRepo,
          categoryId,
          existingDef.id,
        );
        continue;
      }

      // Create new field definition
      try {
        const fieldDef = FieldDefinition.create({
          name: fieldName,
          label: inferred.label,
          dataType: inferred.dataType,
          entityType: "Asset",
          isGlobal: false,
          isRequired: false,
          isUnique: false,
          isSearchable: true,
          isFilterable: true,
        });

        const created = await fieldDefRepo.create(fieldDef);

        this.fieldDefinitionCache.set(cacheKey, created.id);
        fieldIdMap.set(fieldName, created.id);

        // Link to category
        await this.createCategoryFieldLink(
          categoryFieldRepo,
          categoryId,
          created.id,
        );

        this.createdFieldDefinitions.push({
          ...inferred,
          name: fieldName,
          label: inferred.label,
          dataType: inferred.dataType,
        });

        this.logger.info("Created field definition", {
          name: fieldName,
          label: inferred.label,
          dataType: inferred.dataType,
          categoryCode,
        });
      } catch (err) {
        this.logger.error(
          "Failed to create field definition",
          err instanceof Error ? err : undefined,
          { name: fieldName },
        );
      }
    }

    return fieldIdMap;
  }

  /**
   * Ensure a field definition is linked to a category
   */
  private async ensureCategoryFieldLink(
    categoryFieldRepo: IAssetCategoryFieldRepository,
    categoryId: string,
    fieldDefinitionId: string,
  ): Promise<void> {
    try {
      const existingLink =
        await categoryFieldRepo.findByAssetCategoryAndFieldDefinition(
          categoryId,
          fieldDefinitionId,
        );
      if (!existingLink) {
        await this.createCategoryFieldLink(
          categoryFieldRepo,
          categoryId,
          fieldDefinitionId,
        );
      }
    } catch {
      // Link might already exist, ignore errors
    }
  }

  /**
   * Create a category field link
   */
  private async createCategoryFieldLink(
    categoryFieldRepo: IAssetCategoryFieldRepository,
    categoryId: string,
    fieldDefinitionId: string,
  ): Promise<void> {
    try {
      const categoryField = AssetCategoryField.create({
        assetCategoryId: categoryId,
        fieldDefinitionId,
        isRequired: false,
        isUnique: false,
        isVisible: true,
        uiOrder: 0,
      });

      await categoryFieldRepo.create(categoryField);
    } catch {
      // Link might already exist, ignore errors
    }
  }

  /**
   * Transform custom field values based on inferred types
   */
  transformCustomFieldValues(
    customData: Record<string, unknown>,
    inferredFields: Map<string, InferredFieldDefinition>,
  ): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};

    for (const [fieldName, value] of Object.entries(customData)) {
      if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
      ) {
        continue;
      }

      const inferred = inferredFields.get(fieldName);
      if (!inferred) {
        transformed[fieldName] = value;
        continue;
      }

      // Transform based on inferred type
      switch (inferred.dataType) {
        case FieldDataTypeEnum.INTEGER:
          transformed[fieldName] = parseInt(String(value), 10);
          break;

        case FieldDataTypeEnum.DECIMAL:
          transformed[fieldName] = parseFloat(String(value));
          break;

        case FieldDataTypeEnum.BOOLEAN: {
          const strValue = String(value).toLowerCase();
          transformed[fieldName] = ["true", "yes", "1"].includes(strValue);
          break;
        }

        case FieldDataTypeEnum.DATE:
          // Keep as string, let the database handle conversion
          transformed[fieldName] = String(value);
          break;

        default:
          transformed[fieldName] = String(value);
      }
    }

    return transformed;
  }
}
