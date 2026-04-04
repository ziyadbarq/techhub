"use server";

/**
 * CMDB Health Controller
 *
 * Server action for retrieving CMDB data quality health metrics.
 */

import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type {
  GetCMDBHealthMetricsUseCase,
  CMDBHealthMetrics,
  DetectStaleCIsUseCase,
  DetectStaleCIsResult,
} from "@/core/use-cases/cmdb/data-quality";

export async function getCMDBHealthMetricsAction(): Promise<
  ActionResponse<CMDBHealthMetrics>
> {
  try {
    await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetCMDBHealthMetricsUseCase>(
      DI_TOKENS.GetCMDBHealthMetricsUseCase,
    );

    const result = await useCase.execute();

    return { success: true, data: result };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getCMDBHealthMetricsAction" },
      "Failed to load CMDB health metrics",
    );
  }
}

export async function detectStaleCIsAction(
  thresholdDays?: number,
  environmentFilter?: string,
): Promise<ActionResponse<DetectStaleCIsResult>> {
  try {
    await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);

    const container = getContainer();
    const useCase = container.get<DetectStaleCIsUseCase>(
      DI_TOKENS.DetectStaleCIsUseCase,
    );

    const result = await useCase.execute({
      thresholdDays,
      environmentFilter,
    });

    return { success: true, data: result };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "detectStaleCIsAction" },
      "Failed to detect stale CIs",
    );
  }
}
