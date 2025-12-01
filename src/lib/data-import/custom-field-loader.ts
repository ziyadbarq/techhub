/**
 * Custom Field Loader for Data Import
 *
 * Dynamically extends entity field configurations with custom fields
 * based on the selected asset category.
 */

import type { EntityFieldConfig } from "./entity-config.types";

export interface CustomFieldDefinition {
  fieldName: string;
  fieldLabel: string;
  fieldDescription: string | null;
  dataType: string;
  enumOptions: string[] | null;
  isRequired: boolean;
  isUnique: boolean;
  isVisible?: boolean;
  uiOrder: number;
  validationRules?: unknown;
}

/**
 * Converts an array of custom field definitions to EntityFieldConfig entries.
 * Callers fetch field definitions at the adapter layer and pass them here to avoid cross-layer imports.
 */
export function toEntityFieldConfigs(
  fields: CustomFieldDefinition[],
): EntityFieldConfig[] {
  return fields
    .filter((field) => field.isVisible ?? true)
    .sort((a, b) => a.uiOrder - b.uiOrder)
    .map((field) => convertToEntityFieldConfig(field));
}

/**
 * Converts an EnrichedAssetCategoryFieldDTO to an EntityFieldConfig
 */
function convertToEntityFieldConfig(
  field: CustomFieldDefinition,
): EntityFieldConfig {
  const rules = (field.validationRules ?? null) as Record<
    string,
    unknown
  > | null;
  // Base config without type - type is added in switch cases
  const baseConfig = {
    name: `attributes.${field.fieldName}`,
    label: field.fieldLabel,
    required: field.isRequired,
    unique: field.isUnique,
    description: field.fieldDescription || undefined,
    examples: generateExamplesForDataType(field.dataType, field.enumOptions),
    autoMap: generateAutoMap(field.fieldName, field.fieldLabel),
    isCustomField: true, // Mark as custom field for special handling
  };

  // Set type and type-specific options
  switch (field.dataType) {
    case "STRING":
      return {
        ...baseConfig,
        type: "string",
        maxLength: getMaxLength(rules),
        sanitization: [{ operation: "trim" }],
      };

    case "TEXT":
      return {
        ...baseConfig,
        type: "string",
        maxLength: getMaxLength(rules) || 5000,
        sanitization: [{ operation: "trim" }],
      };

    case "INTEGER":
      return {
        ...baseConfig,
        type: "number",
        min: getMin(rules),
        max: getMax(rules),
        validations: [
          {
            type: "integer",
            message: `${field.fieldLabel} must be a whole number`,
          },
        ],
      };

    case "DECIMAL":
      return {
        ...baseConfig,
        type: "number",
        min: getMin(rules),
        max: getMax(rules),
      };

    case "BOOLEAN":
      return {
        ...baseConfig,
        type: "boolean",
      };

    case "DATE":
      return {
        ...baseConfig,
        type: "date",
      };

    case "DATETIME":
      return {
        ...baseConfig,
        type: "date", // Import treats datetime as date (time parsed separately)
      };

    case "ENUM":
      return {
        ...baseConfig,
        type: "enum",
        enum: field.enumOptions || [],
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
      };

    case "JSON":
      return {
        ...baseConfig,
        type: "string", // JSON imported as string and parsed
        description: `${field.fieldDescription || field.fieldLabel} (JSON format)`,
        examples: ['{"key": "value"}'],
      };

    case "CI_REFERENCE":
      return {
        ...baseConfig,
        type: "lookup",
        lookupTarget: "ConfigurationItem",
        lookupField: "ciKey",
        lookupDisplayField: "name",
        description: `${field.fieldDescription || field.fieldLabel} (CI Key)`,
      };

    case "PERSON_REFERENCE":
      return {
        ...baseConfig,
        type: "lookup",
        lookupTarget: "Person",
        lookupField: "email",
        lookupDisplayField: "firstName",
        description: `${field.fieldDescription || field.fieldLabel} (Person Email)`,
      };

    case "ORG_UNIT_REFERENCE":
      return {
        ...baseConfig,
        type: "lookup",
        lookupTarget: "OrganizationUnit",
        lookupField: "code",
        lookupDisplayField: "name",
        description: `${field.fieldDescription || field.fieldLabel} (Org Unit Code)`,
      };

    case "LOCATION_REFERENCE":
      return {
        ...baseConfig,
        type: "lookup",
        lookupTarget: "Location",
        lookupField: "code",
        lookupDisplayField: "name",
        description: `${field.fieldDescription || field.fieldLabel} (Location Code)`,
      };

    default:
      return {
        ...baseConfig,
        type: "string",
        sanitization: [{ operation: "trim" }],
      };
  }
}

/**
 * Generate example values based on data type
 */
function generateExamplesForDataType(
  dataType: string,
  enumOptions: string[] | null,
): string[] {
  switch (dataType) {
    case "STRING":
    case "TEXT":
      return ["Example text"];
    case "INTEGER":
      return ["1", "42", "100"];
    case "DECIMAL":
      return ["1.50", "99.99"];
    case "BOOLEAN":
      return ["true", "false", "yes", "no"];
    case "DATE":
    case "DATETIME":
      return ["2024-01-15", "01/15/2024"];
    case "ENUM":
      return enumOptions?.slice(0, 3) || [];
    case "JSON":
      return ['{"key": "value"}'];
    case "CI_REFERENCE":
      return ["CI-001"];
    case "PERSON_REFERENCE":
      return ["user@example.com"];
    case "ORG_UNIT_REFERENCE":
    case "LOCATION_REFERENCE":
      return ["CODE-001"];
    default:
      return [];
  }
}

/**
 * Generate auto-map patterns for column name matching
 */
function generateAutoMap(fieldName: string, fieldLabel: string): string[] {
  const patterns: string[] = [
    fieldName,
    fieldLabel.toLowerCase().replace(/\s+/g, "_"),
    fieldLabel.toLowerCase().replace(/\s+/g, ""),
    `custom_${fieldName}`,
    `attr_${fieldName}`,
  ];

  return [...new Set(patterns)];
}

/**
 * Helper to extract maxLength from validation rules
 */
function getMaxLength(
  rules: Record<string, unknown> | null,
): number | undefined {
  if (!rules) return undefined;
  const maxLength = rules.maxLength;
  return typeof maxLength === "number" ? maxLength : undefined;
}

/**
 * Helper to extract min from validation rules
 */
function getMin(rules: Record<string, unknown> | null): number | undefined {
  if (!rules) return undefined;
  const min = rules.min;
  return typeof min === "number" ? min : undefined;
}

/**
 * Helper to extract max from validation rules
 */
function getMax(rules: Record<string, unknown> | null): number | undefined {
  if (!rules) return undefined;
  const max = rules.max;
  return typeof max === "number" ? max : undefined;
}

/**
 * Merge base entity fields with custom fields
 */
export function mergeFieldsWithCustomFields(
  baseFields: EntityFieldConfig[],
  customFields: EntityFieldConfig[],
): EntityFieldConfig[] {
  // Add custom fields after base fields
  return [...baseFields, ...customFields];
}

/**
 * Extract custom field values from a row's attributes.* keys
 * and transform them into an attributes object
 */
export function extractCustomFieldValues(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith("attributes.")) {
      const fieldName = key.replace("attributes.", "");
      if (value !== null && value !== undefined && value !== "") {
        attributes[fieldName] = value;
      }
    }
  }

  return Object.keys(attributes).length > 0 ? attributes : {};
}
