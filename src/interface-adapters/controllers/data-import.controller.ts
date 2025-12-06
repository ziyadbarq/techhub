/**
 * Data Import Controller
 *
 * Server actions for universal data import functionality.
 * Provides helpers for import workflow orchestration.
 */

"use server";

import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { EntityConfig } from "@/lib/data-import/entity-config.types";
import type { FeatureFlagKey } from "@/lib/features/feature-flag-keys";
import { isFeatureEnabled } from "@/lib/features/server";

/**
 * Validate import permission for an entity
 *
 * Checks if the current user has permission to import data for the specified entity.
 */
export async function validateImportPermissionAction(
  entityKey: string,
  permissionKey: string,
): Promise<ActionResponse<{ hasPermission: boolean }>> {
  try {
    // Check if user has data import permission
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    // Check if user has permission for the specific entity
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await requirePermission(permissionKey as any);
      return {
        success: true,
        data: { hasPermission: true },
      };
    } catch {
      return {
        success: true,
        data: { hasPermission: false },
      };
    }
  } catch (error) {
    return handleControllerError(
      error,
      { function: "validateImportPermissionAction", entityKey },
      "Failed to validate import permission",
    );
  }
}

/**
 * Get entity import statistics
 *
 * Returns current counts and metadata for an entity to help users
 * understand the impact of their import.
 */
export async function getEntityStatsAction(entityTableName: string): Promise<
  ActionResponse<{
    totalRecords: number;
    lastImportDate?: Date;
    lastImportedBy?: string;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    // TODO: Implement entity stats fetching
    // For now, return placeholder data
    return {
      success: true,
      data: {
        totalRecords: 0,
        lastImportDate: undefined,
        lastImportedBy: undefined,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getEntityStatsAction", entityTableName },
      "Failed to get entity statistics",
    );
  }
}

/**
 * Record import history
 *
 * Logs an import operation for audit trail purposes.
 */
export async function recordImportHistoryAction(
  entityKey: string,
  _importData: {
    totalRows: number;
    successCount: number;
    failureCount: number;
    skipCount: number;
    duration: number;
    fileName: string;
    fileSize: number;
  },
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    // TODO: Implement import history logging
    // This would create a record in an ImportHistory table
    // For now, just return success

    return {
      success: true,
      data: { id: "placeholder-id" },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "recordImportHistoryAction", entityKey },
      "Failed to record import history",
    );
  }
}

/**
 * Get import history for an entity
 *
 * Retrieves past import operations for reference.
 */
export async function getImportHistoryAction(
  entityKey: string,
  limit: number = 10,
): Promise<
  ActionResponse<
    Array<{
      id: string;
      entityKey: string;
      fileName: string;
      totalRows: number;
      successCount: number;
      failureCount: number;
      skipCount: number;
      duration: number;
      importedAt: Date;
      importedBy: string;
    }>
  >
> {
  try {
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    // TODO: Implement import history fetching
    // For now, return empty array
    return {
      success: true,
      data: [],
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getImportHistoryAction", entityKey, limit },
      "Failed to get import history",
    );
  }
}

/**
 * Ensure the controlling feature flag is enabled before import
 */
export async function ensureFeatureEnabledForImportAction(
  featureFlag?: FeatureFlagKey,
): Promise<ActionResponse<{ enabled: boolean }>> {
  try {
    if (!featureFlag) {
      return { success: true, data: { enabled: true } };
    }

    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    const enabled = await isFeatureEnabled(featureFlag);
    if (!enabled) {
      return {
        success: false,
        error: `${featureFlag} is disabled. Enable it before importing.`,
      };
    }

    return {
      success: true,
      data: { enabled: true },
    };
  } catch (error) {
    return handleControllerError(
      error,
      {
        function: "ensureFeatureEnabledForImportAction",
        featureFlag,
      },
      "Failed to validate feature flag for import",
    );
  }
}

/**
 * Validate import settings
 *
 * Server-side validation of import settings before starting import.
 */
export async function validateImportSettingsAction(
  entityConfig: EntityConfig,
  settings: {
    batchSize: number;
    maxParallelBatches: number;
    duplicateStrategy: string;
  },
): Promise<
  ActionResponse<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>
> {
  try {
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate batch size
    if (settings.batchSize < 1) {
      errors.push("Batch size must be at least 1");
    }
    if (settings.batchSize > entityConfig.maxBatchSize) {
      errors.push(
        `Batch size cannot exceed ${entityConfig.maxBatchSize} for ${entityConfig.name}`,
      );
    }

    // Validate parallel batches
    if (settings.maxParallelBatches < 1 || settings.maxParallelBatches > 4) {
      errors.push("Max parallel batches must be between 1 and 4");
    }

    // Warning for high parallel processing
    if (settings.maxParallelBatches > 2 && settings.batchSize > 50) {
      warnings.push(
        "High batch size with parallel processing may overwhelm the database",
      );
    }

    // Validate duplicate strategy
    const validStrategies = ["skip", "overwrite", "fail", "append"];
    if (!validStrategies.includes(settings.duplicateStrategy)) {
      errors.push("Invalid duplicate strategy");
    }

    return {
      success: true,
      data: {
        valid: errors.length === 0,
        errors,
        warnings,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "validateImportSettingsAction" },
      "Failed to validate import settings",
    );
  }
}

/**
 * Check for duplicate records
 *
 * Pre-flight check to see if the import would create duplicates.
 */
export async function checkDuplicatesAction(
  entityTableName: string,
  _uniqueFields: string[],
  _values: Array<Record<string, unknown>>,
): Promise<
  ActionResponse<{
    duplicateCount: number;
    duplicates: Array<{
      rowIndex: number;
      value: string;
      existingId: string;
    }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.DATA_IMPORT_MANAGE);

    // TODO: Implement duplicate checking against database
    // This would query the database for existing records matching unique field values
    // For now, return placeholder

    return {
      success: true,
      data: {
        duplicateCount: 0,
        duplicates: [],
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "checkDuplicatesAction", entityTableName },
      "Failed to check for duplicates",
    );
  }
}
