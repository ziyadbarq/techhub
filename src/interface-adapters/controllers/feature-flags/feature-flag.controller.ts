/**
 * Feature Flag Controller
 * Server actions for managing feature flags
 */

"use server";

import { revalidatePath } from "next/cache";
import { handleControllerError } from "../error-handler";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { $Enums } from "@/generated/prisma";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getSession } from "@/lib/auth";
import { isValidFeatureFlag } from "@/lib/features/feature-flag-keys";
import {
  invalidateFeatureCache,
  invalidateAllFeaturesCache,
} from "@/lib/features/server";

import type { ListFeatureFlagsUseCase } from "@/core/use-cases/feature-flags/list-feature-flags.use-case";
import type { GetFeatureFlagUseCase } from "@/core/use-cases/feature-flags/get-feature-flag.use-case";
import type { ToggleFeatureFlagUseCase } from "@/core/use-cases/feature-flags/toggle-feature-flag.use-case";
import type { IFeatureFlagRepository } from "@/core/repositories/feature-flag.repository.interface";
import type { IFeatureFlagAuditService } from "@/core/services/feature-flag-audit.service.interface";

import type {
  ListFeatureFlagsResponseDTO,
  FeatureFlagResponseDTO,
  ToggleFeatureFlagRequestDTO,
  ToggleFeatureFlagResponseDTO,
} from "../../dtos/feature-flags/feature-flag.dto";
import { FeatureFlagPresenter } from "../../presenters/feature-flags/feature-flag.presenter";
import type { ActionResponse } from "../types";

/**
 * List all feature flags
 */
export async function listFeatureFlagsAction(): Promise<
  ActionResponse<ListFeatureFlagsResponseDTO>
> {
  try {
    await requirePermission(PERMISSIONS.FEATURE_FLAGS_MANAGE);

    const container = getContainer();
    const useCase = container.get<ListFeatureFlagsUseCase>(
      DI_TOKENS.ListFeatureFlagsUseCase,
    );

    const result = await useCase.execute({});

    return {
      success: true,
      data: {
        flags: FeatureFlagPresenter.toDTOList(result.flags),
        total: result.total,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listFeatureFlagsAction" },
      "Failed to list feature flags",
    );
  }
}

/**
 * Get a single feature flag by name
 */
export async function getFeatureFlagAction(
  name: string,
): Promise<ActionResponse<FeatureFlagResponseDTO>> {
  try {
    await requirePermission(PERMISSIONS.FEATURE_FLAGS_MANAGE);

    const container = getContainer();
    const useCase = container.get<GetFeatureFlagUseCase>(
      DI_TOKENS.GetFeatureFlagUseCase,
    );

    const featureFlag = await useCase.execute({ name });

    return {
      success: true,
      data: FeatureFlagPresenter.toDTO(featureFlag),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getFeatureFlagAction" },
      "Failed to get feature flag",
    );
  }
}

/**
 * Toggle a feature flag (enable/disable)
 */
export async function toggleFeatureFlagAction(
  request: ToggleFeatureFlagRequestDTO,
): Promise<ActionResponse<ToggleFeatureFlagResponseDTO>> {
  try {
    await requirePermission(PERMISSIONS.FEATURE_FLAGS_MANAGE);

    const session = await getSession();
    if (!session?.user) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    if (!isValidFeatureFlag(request.name)) {
      return {
        success: false,
        error: "Invalid feature flag name",
      };
    }

    const container = getContainer();
    const useCase = container.get<ToggleFeatureFlagUseCase>(
      DI_TOKENS.ToggleFeatureFlagUseCase,
    );
    const auditService = container.get<IFeatureFlagAuditService>(
      DI_TOKENS.IFeatureFlagAuditService,
    );

    // Execute the toggle
    const result = await useCase.execute({
      name: request.name,
      userId: session.user.id,
      userEmail: session.user.email ?? "unknown",
      reason: request.reason,
    });
    const action: $Enums.FeatureFlagAction =
      result.action === "ENABLED"
        ? $Enums.FeatureFlagAction.ENABLED
        : $Enums.FeatureFlagAction.DISABLED;

    // Create audit log entry
    await auditService.log({
      featureName: request.name,
      action,
      userId: session.user.id,
      userEmail: session.user.email ?? "unknown",
      reason: request.reason,
    });

    // Invalidate cache (both individual and bulk cache)
    await invalidateFeatureCache(request.name);
    await invalidateAllFeaturesCache();

    // Revalidate paths
    revalidatePath("/admin/features");
    revalidatePath("/"); // Dashboard may need to update navigation

    return {
      success: true,
      data: {
        featureFlag: FeatureFlagPresenter.toDTO(result.featureFlag),
        action: result.action,
        warnings: result.warnings,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "toggleFeatureFlagAction" },
      "Failed to toggle feature flag",
    );
  }
}

/**
 * Bulk toggle all feature flags (enable all / disable all)
 * Excludes MAINTENANCE_MODE from bulk operations for safety
 */
export async function bulkToggleFeatureFlagsAction(
  enable: boolean,
  reason?: string,
): Promise<
  ActionResponse<{
    toggledCount: number;
    skippedFlags: string[];
  }>
> {
  try {
    await requirePermission(PERMISSIONS.FEATURE_FLAGS_MANAGE);

    const session = await getSession();
    if (!session?.user) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get all feature flags
    const container = getContainer();
    const listUseCase = container.get<ListFeatureFlagsUseCase>(
      DI_TOKENS.ListFeatureFlagsUseCase,
    );
    const repo = container.get<IFeatureFlagRepository>(
      DI_TOKENS.IFeatureFlagRepository,
    );
    const auditService = container.get<IFeatureFlagAuditService>(
      DI_TOKENS.IFeatureFlagAuditService,
    );

    const allFlagsResult = await listUseCase.execute({});
    const allFlags = allFlagsResult.flags;

    // Exclude MAINTENANCE_MODE from bulk operations
    const flagsToToggle = allFlags.filter(
      (flag) => flag.name !== "MAINTENANCE_MODE",
    );
    const skippedFlags = allFlags
      .filter((flag) => flag.name === "MAINTENANCE_MODE")
      .map((f) => f.name);

    // Toggle each flag
    const action: $Enums.FeatureFlagAction = enable
      ? $Enums.FeatureFlagAction.ENABLED
      : $Enums.FeatureFlagAction.DISABLED;
    let toggledCount = 0;

    for (const flag of flagsToToggle) {
      // Only toggle if the current state differs from the target state
      if (flag.isEnabled !== enable) {
        await repo.update(flag.toggle());
        await auditService.log({
          featureName: flag.name,
          action,
          userId: session.user.id,
          userEmail: session.user.email ?? "unknown",
          reason: reason ?? `Bulk ${action} all features`,
        });

        // Invalidate cache for this flag
        if (isValidFeatureFlag(flag.name)) {
          await invalidateFeatureCache(flag.name);
        }

        toggledCount++;
      }
    }

    // Invalidate the bulk features cache after all toggles
    await invalidateAllFeaturesCache();

    // Revalidate paths
    revalidatePath("/admin/features");
    revalidatePath("/");

    return {
      success: true,
      data: {
        toggledCount,
        skippedFlags,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkToggleFeatureFlagsAction" },
      "Failed to bulk toggle feature flags",
    );
  }
}

/**
 * Get audit log for a feature flag
 */
export async function getFeatureFlagAuditLogAction(
  featureName: string,
): Promise<
  ActionResponse<
    Array<{
      id: string;
      action: string;
      userId: string;
      userEmail: string;
      reason: string | null;
      createdAt: Date;
    }>
  >
> {
  try {
    await requirePermission(PERMISSIONS.FEATURE_FLAGS_MANAGE);

    const container = getContainer();
    const auditService = container.get<IFeatureFlagAuditService>(
      DI_TOKENS.IFeatureFlagAuditService,
    );
    const auditLogs = await auditService.getRecentLogs(featureName, 50);

    return {
      success: true,
      data: auditLogs,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getFeatureFlagAuditLogAction" },
      "Failed to get audit log",
    );
  }
}
