/**
 * Type definitions for Universal Assets Importer
 *
 * This module defines the types for importing assets with automatic creation
 * of related entities (Vendor, Category, Model, Location, etc.)
 */

import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import type { DuplicateStrategy } from "../entity-config.types";

/**
 * Prefix configuration for parsing CSV columns
 */
export const PREFIX_CONFIG = {
  "person.": {
    entity: "Person",
    autoCreate: false,
    requiredForImport: true,
  },
  "asset.": {
    entity: "Asset",
    autoCreate: false,
    requiredForImport: true,
  },
  "vendor.": {
    entity: "Vendor",
    autoCreate: true,
    requiredForImport: false,
  },
  "category.": {
    entity: "AssetCategory",
    autoCreate: true,
    requiredForImport: false,
  },
  "model.": {
    entity: "AssetModel",
    autoCreate: true,
    requiredForImport: false,
  },
  "location.": {
    entity: "Location",
    autoCreate: true,
    requiredForImport: false,
  },
  "stock_location.": {
    entity: "StockLocation",
    autoCreate: true,
    requiredForImport: false,
  },
  "lifecycle.": {
    entity: "LifecycleState",
    autoCreate: false, // Lookup only, no auto-create
    requiredForImport: false,
  },
  "custom.": {
    entity: "FieldDefinition",
    autoCreate: true,
    requiredForImport: false,
  },
} as const;

export type PrefixKey = keyof typeof PREFIX_CONFIG;

/**
 * Parsed column with prefix information
 */
export interface PrefixedColumn {
  /** Original column name from CSV */
  originalColumn: string;
  /** Detected prefix (e.g., "vendor.") */
  prefix: PrefixKey | null;
  /** Field name after prefix (e.g., "name" from "vendor.name") */
  fieldName: string;
  /** Target entity (e.g., "Vendor") */
  targetEntity: string;
  /** Whether this entity can be auto-created */
  isAutoCreate: boolean;
  /** Confidence score 0-100 */
  confidence: number;
}

/**
 * Grouped row data by entity prefix
 */
export interface GroupedRowData {
  person: PersonData;
  asset: AssetData;
  vendor?: VendorData;
  category?: CategoryData;
  model?: ModelData;
  location?: LocationData;
  stockLocation?: StockLocationData;
  lifecycle?: LifecycleData;
  custom: Record<string, unknown>;
}

/**
 * Person data from CSV (must exist, no auto-create)
 */
export interface PersonData {
  email: string;
}

/**
 * Asset core fields from CSV
 */
export interface AssetData {
  serialNumber: string;
  assetTag?: string;
  purchaseDate?: string | Date;
  purchaseCost?: number | string;
  currency?: string;
  condition?: string;
  note?: string;
  depreciationModel?: string;
  depreciationStart?: string | Date;
  depreciationEnd?: string | Date;
}

/**
 * Vendor data for auto-creation
 */
export interface VendorData {
  code?: string;
  name?: string;
  type?: string;
  email?: string;
  phone?: string;
  website?: string;
}

/**
 * Asset Category data for auto-creation
 */
export interface CategoryData {
  code?: string;
  name?: string;
  description?: string;
}

/**
 * Asset Model data for auto-creation
 */
export interface ModelData {
  code?: string;
  name?: string;
  description?: string;
  defaultWarrantyMonths?: number | string;
}

/**
 * Location data for auto-creation
 */
export interface LocationData {
  code?: string;
  name?: string;
  type?: string;
  description?: string;
}

/**
 * Stock Location data for auto-creation
 */
export interface StockLocationData {
  code?: string;
  name?: string;
  description?: string;
}

/**
 * Lifecycle State data (lookup only, no auto-create)
 */
export interface LifecycleData {
  code?: string;
}

/**
 * Result of auto-creating or resolving an entity
 */
export interface AutoCreateResult {
  entityType:
    | "Vendor"
    | "AssetCategory"
    | "AssetModel"
    | "Location"
    | "StockLocation"
    | "LifecycleState"
    | "FieldDefinition";
  /** Original identifier from CSV (code or name) */
  identifier: string;
  /** Action taken */
  action: "created" | "resolved" | "failed" | "skipped";
  /** Resolved entity ID */
  id?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Settings specific to universal assets import
 */
export interface UniversalImportSettings {
  /** Whether to auto-create missing entities */
  autoCreateMissingEntities: boolean;
  /** Skip row if auto-creation fails */
  skipRowOnAutoCreateFailure: boolean;
  /** Whether to handle assignment changes */
  handleAssignmentChanges: boolean;
  /** Close old assignments when person changes */
  closeOldAssignmentsOnReassign: boolean;
  /** Whether person.email is required for import (default: false - allows unassigned assets) */
  requirePersonForImport: boolean;
  /** Person ID of the user performing the import (used for stock movement tracking) */
  performedById?: string;

  // Standard import settings (optional - defaults applied if not specified)

  /** How to handle duplicate assets (by serial number) */
  duplicateStrategy?: DuplicateStrategy;
  /** Remove leading/trailing whitespace from all fields */
  autoTrimWhitespace?: boolean;
  /** Normalize text case (uppercase codes, title case names, lowercase emails) */
  normalizeText?: boolean;
  /** Skip rows where all fields are empty */
  skipEmptyRows?: boolean;
  /** Auto-fix common errors (smart quotes, boolean variations, number formats) */
  autoFixCommonErrors?: boolean;
  /** Validate without actually importing */
  dryRun?: boolean;
  /** Stop processing on first error */
  stopOnFirstError?: boolean;
  /** Maximum errors before aborting import */
  maxErrorsBeforeAbort?: number;
}

/**
 * Default settings for universal assets import
 */
export const DEFAULT_UNIVERSAL_IMPORT_SETTINGS: UniversalImportSettings = {
  // Universal-specific settings
  autoCreateMissingEntities: true,
  skipRowOnAutoCreateFailure: true,
  handleAssignmentChanges: true,
  closeOldAssignmentsOnReassign: true,
  requirePersonForImport: false,
  performedById: undefined,

  // Standard import settings defaults
  duplicateStrategy: "overwrite", // Current behavior - update existing assets
  autoTrimWhitespace: true,
  normalizeText: true,
  skipEmptyRows: true,
  autoFixCommonErrors: true,
  dryRun: false,
  stopOnFirstError: false,
  maxErrorsBeforeAbort: 100,
};

/**
 * Import phases for progress tracking
 */
export type UniversalImportPhase =
  | "parsing"
  | "validating-persons"
  | "resolving-vendors"
  | "resolving-locations"
  | "resolving-stock-locations"
  | "resolving-categories"
  | "looking-up-lifecycle-states"
  | "resolving-models"
  | "processing-custom-fields"
  | "importing-assets"
  | "creating-assignments"
  | "complete";

/**
 * Progress tracking for universal import
 */
export interface UniversalImportProgress {
  phase: UniversalImportPhase;
  currentPhaseLabel: string;
  phasesComplete: number;
  totalPhases: number;
  currentPhaseProgress: number;
  currentPhaseTotal: number;
  /** Summary of auto-created entities */
  autoCreated: {
    vendors: number;
    categories: number;
    models: number;
    locations: number;
    stockLocations: number;
    fieldDefinitions: number;
  };
}

/**
 * Individual asset record for result display
 */
export interface ImportedAssetRecord {
  id: string;
  assetTag: string;
  serialNumber: string;
  rowNumber: number;
}

/**
 * Result of universal assets import
 */
export interface UniversalImportResult {
  /** Overall success status */
  success: boolean;

  /** Standard metrics */
  totalRows: number;
  successCount: number;
  skipCount: number;
  failureCount: number;

  /** Asset-specific metrics */
  assetsCreated: number;
  assetsUpdated: number;

  /** Individual asset records for result display */
  createdAssets: ImportedAssetRecord[];
  updatedAssets: ImportedAssetRecord[];

  /** Assignment-specific metrics */
  assignmentsCreated: number;
  assignmentsReassigned: number;
  assignmentsUnchanged: number;

  /** Auto-creation summary */
  autoCreatedEntities: AutoCreateResult[];

  /** Field definitions created during import */
  fieldDefinitionsCreated: Array<{
    name: string;
    label: string;
    dataType: string;
    categoryCode: string;
  }>;

  /** Duration in seconds */
  duration: number;

  /** Rows per second */
  throughput: number;

  /** Detailed errors for failed rows */
  errors: Array<{
    rowNumber: number;
    identifier: string;
    error: string;
    suggestion?: string;
  }>;

  /** Rows that were skipped */
  skipped: Array<{
    rowNumber: number;
    identifier: string;
    reason: string;
  }>;

  /** Warnings (non-blocking issues like duplicates) */
  warnings?: Array<{
    type: string;
    message: string;
    rowNumbers?: number[];
  }>;
}

/**
 * Assignment action result
 */
export interface AssignmentResult {
  action: "created" | "reassigned" | "unchanged" | "failed";
  assignmentId?: string;
  previousAssigneeEmail?: string;
  newAssigneeEmail?: string;
  error?: string;
}

/**
 * Inferred field definition from custom.* column
 */
export interface InferredFieldDefinition {
  /** Snake_case field name derived from column */
  name: string;
  /** Human-readable label derived from column */
  label: string;
  /** Inferred data type from values */
  dataType: FieldDataTypeEnum;
  /** Values used for inference */
  sampleValues: unknown[];
}

/**
 * Entity resolution cache for performance
 */
export interface EntityCache {
  vendors: Map<string, string>; // code/name -> id
  categories: Map<string, string>; // code/name -> id
  models: Map<string, string>; // code/name -> id
  locations: Map<string, string>; // code/name -> id
  stockLocations: Map<string, string>; // code/name -> id
  lifecycleStates: Map<string, string>; // code -> id
  persons: Map<string, string>; // email -> id
  fieldDefinitions: Map<string, string>; // name -> id
}

/**
 * Row processing context with resolved IDs
 */
export interface RowContext {
  rowNumber: number;
  personId: string;
  personEmail: string;
  vendorId?: string;
  categoryId?: string;
  modelId?: string;
  locationId?: string;
  stockLocationId?: string;
  lifecycleStateId?: string;
  assetData: AssetData;
  customFields: Record<string, unknown>;
}

/**
 * Composite unique key for asset deduplication
 */
export interface AssetUniqueKey {
  personEmail: string;
  serialNumber: string;
}

/**
 * Existing asset match result
 */
export interface ExistingAssetMatch {
  assetId: string;
  assetTag: string;
  currentAssigneeId?: string;
  currentAssigneeEmail?: string;
}
