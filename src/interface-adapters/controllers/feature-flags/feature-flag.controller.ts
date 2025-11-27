/**
 * Feature Flag Controller
 * Server actions for managing feature flags
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getSession } from "@/lib/auth";
import { invalidateFeatureCache } from "@/lib/features/server";
import { prisma } from "@/infrastructure/database/prisma/client";

import type { ListFeatureFlagsUseCase } from "@/core/use-cases/feature-flags/list-feature-flags.use-case";
import type { GetFeatureFlagUseCase } from "@/core/use-cases/feature-flags/get-feature-flag.use-case";
import type { ToggleFeatureFlagUseCase } from "@/core/use-cases/feature-flags/toggle-feature-flag.use-case";

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
    console.error("Error listing feature flags:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list feature flags",
    };
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
    console.error("Error getting feature flag:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get feature flag",
    };
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

    const container = getContainer();
    const useCase = container.get<ToggleFeatureFlagUseCase>(
      DI_TOKENS.ToggleFeatureFlagUseCase,
    );

    // Execute the toggle
    const result = await useCase.execute({
      name: request.name,
      userId: session.user.id,
      userEmail: session.user.email ?? "unknown",
      reason: request.reason,
    });

    // Create audit log entry
    await prisma.featureFlagAuditLog.create({
      data: {
        featureName: request.name,
        action: result.action,
        userId: session.user.id,
        userEmail: session.user.email ?? "unknown",
        reason: request.reason,
      },
    });

    // Invalidate cache
    await invalidateFeatureCache(request.name);

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
    console.error("Error toggling feature flag:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle feature flag",
    };
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
    const allFlags = await prisma.featureFlag.findMany();

    // Exclude MAINTENANCE_MODE from bulk operations
    const flagsToToggle = allFlags.filter(
      (flag) => flag.name !== "MAINTENANCE_MODE",
    );
    const skippedFlags = allFlags
      .filter((flag) => flag.name === "MAINTENANCE_MODE")
      .map((f) => f.name);

    // Toggle each flag
    const action = enable ? "enabled" : "disabled";
    let toggledCount = 0;

    for (const flag of flagsToToggle) {
      // Only toggle if the current state differs from the target state
      if (flag.isEnabled !== enable) {
        await prisma.featureFlag.update({
          where: { id: flag.id },
          data: { isEnabled: enable },
        });

        // Create audit log entry
        await prisma.featureFlagAuditLog.create({
          data: {
            featureName: flag.name,
            action,
            userId: session.user.id,
            userEmail: session.user.email ?? "unknown",
            reason: reason ?? `Bulk ${action} all features`,
          },
        });

        // Invalidate cache for this flag
        await invalidateFeatureCache(flag.name);

        toggledCount++;
      }
    }

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
    console.error("Error bulk toggling feature flags:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk toggle feature flags",
    };
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

    const auditLogs = await prisma.featureFlagAuditLog.findMany({
      where: { featureName: featureName.toUpperCase() },
      orderBy: { createdAt: "desc" },
      take: 50, // Last 50 entries
    });

    return {
      success: true,
      data: auditLogs,
    };
  } catch (error) {
    console.error("Error getting audit log:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get audit log",
    };
  }
}
