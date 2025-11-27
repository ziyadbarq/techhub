/**
 * Type definitions for Universal Data Importer entity configurations
 *
 * This file defines the structure for entity metadata, field configurations,
 * validation rules, and sanitization strategies used across the data import system.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

/**
 * Supported field types for entity configuration
 */
export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "enum"
  | "lookup"
  | "json";

/**
 * Entity categories for organization and filtering
 */
export type EntityCategory =
  | "FOUNDATION"
  | "ASSET_MANAGEMENT"
  | "INVENTORY"
  | "CMDB"
  | "CONTRACTS"
  | "LICENSES"
  | "SERVICES"
  | "GOVERNANCE"
  | "ATTACHMENTS"
  | "SYSTEM";

/**
 * Duplicate handling strategies
 */
export type DuplicateStrategy = "skip" | "overwrite" | "fail" | "append";

/**
 * Validation severity levels
 */
export type ValidationSeverity = "error" | "warning" | "info";

/**
 * Data sanitization operations
 */
export type SanitizationOperation =
  | "trim"
  | "uppercase"
  | "lowercase"
  | "titleCase"
  | "removeSpaces"
  | "removeSpecialChars"
  | "normalizeWhitespace"
  | "removeBOM"
  | "normalizeLineEndings";

/**
 * Built-in validation rule types
 */
export type ValidationRuleType =
  | "required"
  | "email"
  | "url"
  | "phone"
  | "alphanumeric"
  | "numeric"
  | "positive"
  | "negative"
  | "integer"
  | "pastDate"
  | "futureDate"
  | "unique"
  | "minLength"
  | "maxLength"
  | "min"
  | "max"
  | "pattern"
  | "custom";

/**
 * Validation rule definition
 */
export interface ValidationRule {
  type: ValidationRuleType;
  value?: unknown; // For rules like minLength, maxLength, pattern, etc.
  message?: string; // Custom error message
  severity?: ValidationSeverity;
}

/**
 * Sanitization rule with operation and optional parameters
 */
export interface SanitizationRule {
  operation: SanitizationOperation;
  params?: Record<string, any>;
}

/**
 * Field configuration for entity import
 */
export interface EntityFieldConfig {
  // Basic metadata
  name: string; // Field name in entity/database
  label: string; // Display name for UI
  description?: string; // Help text for users

  // Type and validation
  type: FieldType;
  required: boolean;
  unique?: boolean; // Must be unique across all records
  autoGenerate?: boolean; // System auto-generates value if not provided

  // Validation rules
  validations?: ValidationRule[];
  minLength?: number;
  maxLength?: number;
  min?: number; // For numeric fields
  max?: number; // For numeric fields
  pattern?: RegExp; // For regex validation

  // Enum configuration
  enum?: string[]; // For enum type fields

  // Lookup configuration
  lookupTarget?: string; // Target entity for lookups (e.g., "AssetCategory")
  lookupField?: string; // Field to match in target entity (e.g., "code")
  lookupDisplayField?: string; // Field to display in UI (e.g., "name")

  // Data processing
  sanitization?: SanitizationRule[];
  defaultValue?: any;
  transform?: (value: any) => any; // Custom transformation function

  // UI hints
  examples?: string[]; // Example values for template
  placeholder?: string;
  helpText?: string;

  // Import behavior
  canIgnore?: boolean; // Can this field be skipped during import?
  autoMap?: string[]; // Alternative column names for auto-mapping

  // Custom field indicator
  isCustomField?: boolean; // True if this is a dynamic custom field from FieldDefinition
}

/**
 * Business rule for cross-field validation
 */
export interface BusinessRule {
  name: string;
  description: string;
  validate: (row: Record<string, any>) => boolean | Promise<boolean>;
  message: string;
  severity: ValidationSeverity;
}

/**
 * Post-processing function to run after import
 */
export type PostProcessor = (
  importedRecords: any[],
  context: ImportContext,
) => Promise<void>;

/**
 * Import context passed to processors and validators
 */
export interface ImportContext {
  entityKey: string;
  userId: string;
  userName: string;
  settings: ImportSettings;
  lookupMaps: Map<string, Map<string, string>>;
}

/**
 * Import settings configured by user
 */
export interface ImportSettings {
  // Duplicate handling
  duplicateStrategy: DuplicateStrategy;
  uniqueFields: string[]; // Fields to check for duplicates
  appendSuffix?: string; // Suffix for 'append' strategy

  // Data processing
  autoTrimWhitespace: boolean;
  normalizeText: boolean;
  skipEmptyRows: boolean;
  autoFixCommonErrors: boolean;

  // Validation
  dryRun: boolean; // Validate only, don't import
  strictValidation: boolean; // Fail on warnings

  // Performance
  batchSize: number;
  maxParallelBatches: number;

  // Error handling
  stopOnFirstError: boolean;
  maxErrorsBeforeAbort: number;

  // Date parsing
  dateFormat?: string; // Manual date format or 'auto'
  autoDetectDateFormat: boolean;
}

/**
 * Main entity configuration
 */
export interface EntityConfig {
  // Identification
  key: string; // Unique key (e.g., "ASSET", "PERSON")
  name: string; // Display name (e.g., "Assets", "Persons")
  tableName: string; // Prisma model name
  description: string; // Description for UI
  category: EntityCategory;

  // Permissions
  permission: PermissionKey; // Required permission to import
  viewPermission?: PermissionKey; // Permission to download template

  // Field configuration
  fields: EntityFieldConfig[];
  requiredFields: string[]; // Field names that must be provided
  uniqueFields: string[]; // Fields that determine duplicates
  lookupFields: string[]; // Fields requiring lookup resolution

  // Import behavior
  bulkCreateAction: Function; // Server action for bulk create
  bulkUpdateAction?: Function; // Server action for bulk update
  /**
   * Server action to check for existing records by unique field values.
   * Used for pre-import duplicate detection.
   */
  checkDuplicatesAction?: (uniqueValues: string[]) => Promise<{
    success: boolean;
    data?: {
      duplicates: Array<{ id: string; [key: string]: unknown }>;
      duplicateCount: number;
    };
    error?: string;
  }>;
  /**
   * Server action for bulk upsert (create or update based on duplicate strategy).
   * Used when duplicateStrategy is "overwrite" to handle both creates and updates.
   */
  bulkUpsertAction?: (
    items: Record<string, unknown>[],
    strategy: DuplicateStrategy,
  ) => Promise<{
    success: boolean;
    data?: {
      createdCount: number;
      updatedCount: number;
      skipCount: number;
      failureCount: number;
      created?: Array<Record<string, unknown>>;
      updated?: Array<Record<string, unknown>>;
      skipped?: Array<{ identifier: string; reason: string }>;
      failures?: Array<{ index: number; identifier: string; error: string }>;
    };
    error?: string;
  }>;
  maxBatchSize: number; // Maximum rows per batch

  // Advanced features
  businessRules?: BusinessRule[]; // Cross-field validation
  postProcessing?: PostProcessor; // After-import processing
  defaultSettings?: Partial<ImportSettings>; // Entity-specific defaults

  // UI customization
  icon?: string; // Icon name for UI
  color?: string; // Color for UI
  templateInstructions?: string; // Custom instructions for template
}

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  field: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  value: any; // The validated/transformed value
}

/**
 * Validation result for a row
 */
export interface RowValidationResult {
  rowNumber: number;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  data: Record<string, any>; // The validated/transformed data
}

/**
 * Validation error with context
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: ValidationSeverity;
  value?: any;
  suggestion?: string; // Suggested fix
}

/**
 * Import validation summary
 */
export interface ImportValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warnings: number;
  errors: number;

  rowResults: RowValidationResult[];
  errorSummary: Map<string, number>; // Error type -> count
  fieldErrors: Map<string, number>; // Field -> error count
}

/**
 * Import progress tracking
 */
export interface ImportProgress {
  status:
    | "idle"
    | "validating"
    | "importing"
    | "completed"
    | "failed"
    | "cancelled";
  totalRows: number;
  processedRows: number;
  successCount: number;
  skipCount: number;
  failureCount: number;

  /** Number of new records created */
  createCount: number;
  /** Number of existing records updated */
  updateCount: number;

  currentBatch: number;
  totalBatches: number;

  startTime: Date;
  endTime?: Date;
  elapsedSeconds: number;
  estimatedRemainingSeconds?: number;

  recentActivity: ImportActivity[];
  errors: ImportError[];
}

/**
 * Recent activity item for progress display
 */
export interface ImportActivity {
  timestamp: Date;
  type: "success" | "skip" | "error";
  message: string;
  rowNumber?: number;
}

/**
 * Import error with details
 */
export interface ImportError {
  rowNumber: number;
  field?: string;
  message: string;
  originalValue?: any;
  suggestion?: string;
}

/**
 * Final import result
 */
export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  skipCount: number;
  failureCount: number;

  /** Number of new records created (subset of successCount) */
  createCount: number;
  /** Number of existing records updated (subset of successCount for overwrite strategy) */
  updateCount: number;

  duration: number; // seconds
  throughput: number; // rows per second

  createdRecords: any[];
  updatedRecords: any[];
  skippedRows: ImportError[];
  failedRows: ImportError[];

  auditLogId?: string;
}

/**
 * Column mapping from CSV to entity field
 */
export interface ColumnMapping {
  csvColumn: string; // Column name from CSV
  entityField: string; // Field name in entity
  isRequired: boolean;
  isMapped: boolean;
  autoMapped: boolean; // Was it auto-mapped?
  confidence?: number; // Mapping confidence (0-100)
}

/**
 * File parsing result
 */
export interface ParsedFile {
  fileName: string;
  fileSize: number;
  mimeType: string;
  rowCount: number;
  columnCount: number;
  columns: string[]; // Column headers
  rows: Record<string, any>[]; // Parsed data
  preview: Record<string, any>[]; // First 5 rows
  parseErrors: string[];
}

/**
 * Lookup map for reference resolution
 */
export interface LookupMap {
  targetEntity: string;
  lookupField: string; // Field to search (e.g., "code")
  displayField: string; // Field to display (e.g., "name")
  entries: Map<string, string>; // lookup value -> ID
  reverseEntries: Map<string, string>; // ID -> lookup value
  allValues: string[]; // All valid values for fuzzy matching
}

/**
 * Fuzzy match result
 */
export interface FuzzyMatchResult {
  input: string;
  closestMatch: string | null;
  similarity: number; // 0-100
  confidence: "high" | "medium" | "low" | "none";
  suggestions: Array<{
    value: string;
    similarity: number;
  }>;
}

/**
 * Template generation options
 */
export interface TemplateOptions {
  includeInstructions: boolean;
  includeExamples: boolean;
  includeOptionalFields: boolean;
  format: "csv" | "xlsx";
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
  fileName: string;
  includeHeaders: boolean;
  includeUTF8BOM: boolean; // For Excel compatibility
  delimiter?: string;
}

/**
 * Preview of what will happen during import based on duplicate strategy
 */
export interface DuplicatePreview {
  /** Total rows in the import file */
  totalRows: number;
  /** Number of rows that will create new records */
  toCreateCount: number;
  /** Number of rows that will update existing records (overwrite strategy) */
  toUpdateCount: number;
  /** Number of rows that will be skipped (skip strategy) */
  toSkipCount: number;
  /** Map of unique field values to existing record IDs (for duplicates found) */
  existingRecordsMap: Map<string, { id: string; displayValue: string }>;
}
