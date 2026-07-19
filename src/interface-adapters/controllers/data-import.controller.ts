/**
 * Data Import Controller
 *
 * Server actions for universal data import functionality.
 *
 * Note: earlier revisions exported stub actions (entity stats, import
 * history recording/fetching, duplicate checking) that returned placeholder
 * data and had no callers. They were removed rather than shipped as fake
 * endpoints; implement them against a real ImportHistory table when the
 * feature is built. Per-entity duplicate checking is handled by the
 * checkDuplicatesAction defined per entity in
 * interface-adapters/data-import/entity-configs.ts.
 */

"use server";

import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { FeatureFlagKey } from "@/lib/features/feature-flag-keys";
import { isFeatureEnabled } from "@/lib/features/server";

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
