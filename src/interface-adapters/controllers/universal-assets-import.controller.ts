/**
 * Universal Assets Import Controller
 *
 * Server actions for the Universal Assets Import feature.
 * Handles the import of assets with automatic creation of related entities.
 * Creates stock movements for imported assets with source tracking.
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getSession } from "@/lib/auth/session";
import {
  processUniversalAssetsImport,
  detectPrefixedColumns,
  validateRequiredColumns,
  generateSampleTemplate,
  getTemplateColumns,
  detectDuplicatesInFile,
  groupRowByPrefix,
} from "@/interface-adapters/data-import/universal-assets";
import type {
  UniversalImportSettings,
  UniversalImportResult,
  UniversalImportProgress,
  PrefixedColumn,
} from "@/interface-adapters/data-import/universal-assets";
import { DEFAULT_UNIVERSAL_IMPORT_SETTINGS } from "@/interface-adapters/data-import/universal-assets/types";

/**
 * Resolve current user's linked person ID for movement tracking
 */
async function resolveCurrentPersonId(
  container: ReturnType<typeof getContainer>,
): Promise<string | null> {
  const { user } = await getSession();
  if (!user) {
    return null;
  }

  const personRepository = container.get<IPersonRepository>(
    DI_TOKENS.IPersonRepository,
  );

  // Prefer explicit user linkage, fallback to email match for existing records
  const person =
    (await personRepository.findByUserId(user.id)) ||
    (user.email ? await personRepository.findByEmail(user.email) : null);

  return person?.id ?? null;
}

/**
 * Response type for import actions
 */
interface ImportActionResponse {
  success: boolean;
  data?: UniversalImportResult;
  error?: string;
}

/**
 * Response type for validation actions
 */
interface ValidationActionResponse {
  success: boolean;
  data?: {
    valid: boolean;
    columns: PrefixedColumn[];
    missingRequired: string[];
    warnings: string[];
    rowCount: number;
  };
  error?: string;
}

/**
 * Response type for template actions
 */
interface TemplateActionResponse {
  success: boolean;
  data?: {
    content: string;
    fileName: string;
    columns: string[];
  };
  error?: string;
}

/**
 * Process Universal Assets Import
 *
 * Main import action that processes a parsed CSV file with prefixed columns.
 * Auto-creates missing entities and handles asset assignments.
 *
 * @param rows - Parsed CSV rows as key-value objects
 * @param columnHeaders - Original column headers from CSV
 * @param settings - Import settings (optional, uses defaults if not provided)
 * @returns Import result with counts and errors
 */
export async function processUniversalAssetsImportAction(
  rows: Array<Record<string, unknown>>,
  columnHeaders: string[],
  settings?: Partial<UniversalImportSettings>,
): Promise<ImportActionResponse> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

    const log = logger.child({
      controller: "universal-assets-import.process",
      rowCount: rows.length,
      columnCount: columnHeaders.length,
    });

    log.info("Universal Assets Import started");

    // Resolve current user's person ID for movement tracking
    const performedById = await resolveCurrentPersonId(container);

    // Merge with default settings, including performedById for movement tracking
    const mergedSettings: UniversalImportSettings = {
      ...DEFAULT_UNIVERSAL_IMPORT_SETTINGS,
      ...settings,
      performedById: performedById ?? undefined,
    };

    // Process the import
    const result = await processUniversalAssetsImport(
      rows,
      columnHeaders,
      mergedSettings,
    );

    // Log completion with appropriate level based on result
    if (result.success) {
      log.info("Universal Assets Import completed successfully", {
        assetsCreated: result.assetsCreated,
        assetsUpdated: result.assetsUpdated,
        duration: result.duration,
      });
    } else {
      log.warn("Universal Assets Import completed with issues", {
        successCount: result.successCount,
        failureCount: result.failureCount,
        skipCount: result.skipCount,
        errors: result.errors.slice(0, 5), // Log first 5 errors
        skipped: result.skipped.slice(0, 5), // Log first 5 skipped reasons
        duration: result.duration,
      });
    }

    // Revalidate asset-related pages
    revalidatePath("/dashboard/assets");
    revalidatePath("/dashboard/data-import");
    revalidatePath("/stock-movements");

    return {
      success: result.success,
      data: result,
    };
  } catch (err) {
    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;

    logger.error(
      "Universal Assets Import failed with exception",
      err instanceof Error ? err : undefined,
      {
        errorMessage,
        errorStack,
        rowCount: rows.length,
        columnCount: columnHeaders.length,
      },
    );

    return {
      success: false,
      error:
        errorMessage ||
        "Import failed due to an unexpected error. Check server logs for details.",
    };
  }
}

/**
 * Process Universal Assets Import with Progress Callback
 *
 * Same as processUniversalAssetsImportAction but returns progress updates.
 * This is used for real-time progress tracking in the UI.
 *
 * Note: Due to server action limitations, progress is collected and returned
 * with the final result rather than streamed in real-time.
 *
 * @param rows - Parsed CSV rows
 * @param columnHeaders - Original column headers
 * @param settings - Import settings
 * @returns Import result with progress history
 */
export async function processUniversalAssetsImportWithProgressAction(
  rows: Array<Record<string, unknown>>,
  columnHeaders: string[],
  settings?: Partial<UniversalImportSettings>,
): Promise<{
  success: boolean;
  data?: UniversalImportResult & { progressHistory: UniversalImportProgress[] };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_CREATE);

    const container = getContainer();
    const progressHistory: UniversalImportProgress[] = [];

    // Resolve current user's person ID for movement tracking
    const performedById = await resolveCurrentPersonId(container);

    // Merge with default settings, including performedById for movement tracking
    const mergedSettings: UniversalImportSettings = {
      ...DEFAULT_UNIVERSAL_IMPORT_SETTINGS,
      ...settings,
      performedById: performedById ?? undefined,
    };

    // Process with progress callback
    const result = await processUniversalAssetsImport(
      rows,
      columnHeaders,
      mergedSettings,
      (progress) => {
        progressHistory.push({ ...progress });
      },
    );

    // Revalidate asset-related pages
    revalidatePath("/dashboard/assets");
    revalidatePath("/dashboard/data-import");
    revalidatePath("/stock-movements");

    return {
      success: result.success,
      data: {
        ...result,
        progressHistory,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

/**
 * Validate Universal Assets Import File
 *
 * Validates the CSV structure and columns before import.
 * Checks for required columns, prefix patterns, and basic data integrity.
 *
 * @param columnHeaders - Column headers from the CSV file
 * @param sampleRows - First few rows for validation preview
 * @returns Validation result with column analysis
 */
export async function validateUniversalAssetsImportAction(
  columnHeaders: string[],
  sampleRows?: Array<Record<string, unknown>>,
): Promise<ValidationActionResponse> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    // Detect and parse columns
    const columns = detectPrefixedColumns(columnHeaders);
    const validation = validateRequiredColumns(columns);

    // Collect warnings
    const warnings: string[] = [];

    // Check for unrecognized columns
    const unrecognizedColumns = columns.filter(
      (c) => c.prefix === null && !c.originalColumn.startsWith("custom."),
    );
    if (unrecognizedColumns.length > 0) {
      warnings.push(
        `${unrecognizedColumns.length} column(s) have no recognized prefix and will be ignored: ${unrecognizedColumns
          .map((c) => c.originalColumn)
          .slice(0, 5)
          .join(", ")}${unrecognizedColumns.length > 5 ? "..." : ""}`,
      );
    }

    // Check for custom fields
    const customFields = columns.filter((c) =>
      c.originalColumn.startsWith("custom."),
    );
    if (customFields.length > 0) {
      warnings.push(
        `${customFields.length} custom field(s) will be auto-created: ${customFields.map((c) => c.fieldName).join(", ")}`,
      );
    }

    // Check for auto-creatable entities
    const autoCreatePrefixes = [
      "vendor.",
      "category.",
      "model.",
      "location.",
      "stock_location.",
    ];
    const autoCreateColumns = columns.filter(
      (c) =>
        c.prefix &&
        autoCreatePrefixes.some((p) => c.originalColumn.startsWith(p)),
    );
    if (autoCreateColumns.length > 0) {
      const entities = [
        ...new Set(autoCreateColumns.map((c) => c.targetEntity)),
      ];
      warnings.push(
        `Missing ${entities.join(", ")} entities will be auto-created if not found.`,
      );
    }

    // Check for duplicate serial numbers in sample rows
    if (sampleRows && sampleRows.length > 0) {
      const parsedSample = sampleRows.map((row, i) => ({
        rowNumber: i + 1,
        data: groupRowByPrefix(row, columns),
      }));
      const dupCheck = detectDuplicatesInFile(parsedSample);
      if (dupCheck.hasDuplicates) {
        warnings.push(
          `Found ${dupCheck.duplicateSerialNumbers.length} duplicate serial number(s) in file. Later rows will update earlier ones.`,
        );
      }
    }

    return {
      success: true,
      data: {
        valid: validation.valid,
        columns,
        missingRequired: validation.missingRequired,
        warnings,
        rowCount: sampleRows?.length ?? 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Download Universal Assets Import Template
 *
 * Generates and returns a CSV template with all supported columns.
 *
 * @param includeExamples - Whether to include example data rows
 * @returns Template content as CSV string
 */
export async function downloadUniversalAssetsTemplateAction(
  includeExamples: boolean = true,
): Promise<TemplateActionResponse> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const columns = getTemplateColumns();
    let content: string;

    if (includeExamples) {
      content = generateSampleTemplate();
    } else {
      // Headers only
      content = columns.join(",");
    }

    return {
      success: true,
      data: {
        content,
        fileName: "universal-assets-import-template.csv",
        columns,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Template generation failed",
    };
  }
}

/**
 * Get Import Settings with Defaults
 *
 * Returns the default import settings for Universal Assets Import.
 * UI can use these as initial values.
 */
export async function getUniversalAssetsImportDefaultSettingsAction(): Promise<{
  success: boolean;
  data?: UniversalImportSettings;
  error?: string;
}> {
  try {
    return {
      success: true,
      data: DEFAULT_UNIVERSAL_IMPORT_SETTINGS,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get settings",
    };
  }
}

/**
 * Get Supported Prefixes and Their Descriptions
 *
 * Returns metadata about supported column prefixes for UI help.
 */
export async function getUniversalAssetsPrefixInfoAction(): Promise<{
  success: boolean;
  data?: Array<{
    prefix: string;
    entity: string;
    autoCreate: boolean;
    description: string;
    examples: string[];
  }>;
  error?: string;
}> {
  try {
    return {
      success: true,
      data: [
        {
          prefix: "person.",
          entity: "Person",
          autoCreate: false,
          description:
            "Person/assignee information (optional). If provided, person must exist in the system. Assets can be imported without assignment.",
          examples: ["person.email"],
        },
        {
          prefix: "asset.",
          entity: "Asset",
          autoCreate: false,
          description: "Core asset fields. serial_number is required.",
          examples: [
            "asset.serial_number",
            "asset.asset_tag",
            "asset.purchase_date",
            "asset.purchase_cost",
            "asset.currency",
          ],
        },
        {
          prefix: "vendor.",
          entity: "Vendor",
          autoCreate: true,
          description:
            "Vendor information. Created automatically if not found.",
          examples: ["vendor.code", "vendor.name"],
        },
        {
          prefix: "category.",
          entity: "AssetCategory",
          autoCreate: true,
          description: "Asset category. Created automatically if not found.",
          examples: ["category.code", "category.name"],
        },
        {
          prefix: "model.",
          entity: "AssetModel",
          autoCreate: true,
          description:
            "Asset model. Created automatically if not found (requires vendor).",
          examples: ["model.code", "model.name"],
        },
        {
          prefix: "location.",
          entity: "Location",
          autoCreate: true,
          description: "Physical location. Created automatically if not found.",
          examples: ["location.code", "location.name"],
        },
        {
          prefix: "stock_location.",
          entity: "StockLocation",
          autoCreate: true,
          description:
            "Stock/warehouse location. Created automatically if not found.",
          examples: ["stock_location.code", "stock_location.name"],
        },
        {
          prefix: "lifecycle.",
          entity: "LifecycleState",
          autoCreate: false,
          description:
            "Asset lifecycle state. Lookup only, must exist in system.",
          examples: ["lifecycle.code"],
        },
        {
          prefix: "custom.",
          entity: "FieldDefinition",
          autoCreate: true,
          description:
            "Custom fields. Field definitions created automatically with inferred data types.",
          examples: [
            "custom.cpu_cores",
            "custom.ram_gb",
            "custom.storage_type",
          ],
        },
      ],
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get prefix info",
    };
  }
}
