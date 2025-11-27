/**
 * Universal Assets Importer Module
 *
 * Barrel export for the universal assets import system.
 * This module handles importing assets with automatic creation of related entities.
 */

// Types
export type {
  PrefixedColumn,
  GroupedRowData,
  PersonData,
  AssetData,
  VendorData,
  CategoryData,
  ModelData,
  LocationData,
  StockLocationData,
  LifecycleData,
  AutoCreateResult,
  UniversalImportSettings,
  UniversalImportPhase,
  UniversalImportProgress,
  UniversalImportResult,
  AssignmentResult,
  InferredFieldDefinition,
  EntityCache,
  RowContext,
  AssetUniqueKey,
  ExistingAssetMatch,
  PrefixKey,
} from "./types";

export { PREFIX_CONFIG, DEFAULT_UNIVERSAL_IMPORT_SETTINGS } from "./types";

// Prefix Parser
export {
  detectPrefixedColumns,
  groupRowByPrefix,
  validateRequiredColumns,
  extractUniquePersonEmails,
  generateFieldLabel,
} from "./prefix-parser";

// Auto-Create Resolver
export { AutoCreateResolver } from "./auto-create-resolver";

// Custom Field Inferrer
export { CustomFieldInferrer, inferDataType } from "./custom-field-inferrer";

// Assignment Handler
export { AssignmentHandler } from "./assignment-handler";

// Main Processor
export { processUniversalAssetsImport } from "./processor";

// Configuration
export {
  UNIVERSAL_ASSETS_CONFIG,
  getSupportedPrefixes,
  getTemplateColumns,
  generateSampleTemplate,
} from "./config";
