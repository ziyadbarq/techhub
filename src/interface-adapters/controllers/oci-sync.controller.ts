"use server";

/**
 * OCI Sync Controller
 *
 * Server actions for OCI Cloud resource synchronization.
 */

import { getContainer, loadHeavyModule, isModuleLoaded } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";
import { getSession } from "@/lib/auth/session";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type { SyncOciResourcesUseCase } from "@/core/use-cases/oci-sync/sync-oci-resources.use-case";
import type { GetOciSyncLogsUseCase } from "@/core/use-cases/oci-sync/get-oci-sync-logs.use-case";
import {
  TriggerOciSyncSchema,
  type TriggerOciSyncDTO,
  type OciSyncResultDTO,
  type OciSyncLogDTO,
} from "@/interface-adapters/dtos/generated/oci-sync.dto";
import {
  presentSyncResult,
  presentSyncLogs,
  presentSyncLog,
} from "@/interface-adapters/presenters/oci-sync.presenter";

// ========================================
// Module Loading
// ========================================

async function ensureOciSyncModuleLoaded(): Promise<void> {
  if (!isModuleLoaded("oci-sync")) {
    await loadHeavyModule("oci-sync");
  }
}

// ========================================
// Server Actions
// ========================================

/**
 * Trigger OCI resource sync
 */
export async function triggerOciSyncAction(
  input: TriggerOciSyncDTO,
): Promise<ActionResponse<OciSyncResultDTO>> {
  try {
    await requireFeature("OCI_SYNC");
    await requirePermission(PERMISSIONS.OCI_SYNC_TRIGGER);
    await ensureOciSyncModuleLoaded();

    const parsed = TriggerOciSyncSchema.parse(input);

    const container = getContainer();
    const syncUseCase = container.get<SyncOciResourcesUseCase>(
      DI_TOKENS.SyncOciResourcesUseCase,
    );

    const { user } = await getSession();
    const result = await syncUseCase.execute({
      serviceKeys: parsed.serviceKeys,
      dryRun: parsed.dryRun,
      triggeredBy: user?.email ?? user?.name ?? "unknown",
    });

    return {
      success: true,
      data: presentSyncResult(result),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "triggerOciSync" },
      "Failed to trigger OCI sync",
    );
  }
}

/**
 * Get OCI sync logs history
 */
export async function getOciSyncLogsAction(
  limit?: number,
): Promise<ActionResponse<OciSyncLogDTO[]>> {
  try {
    await requireFeature("OCI_SYNC");
    await requirePermission(PERMISSIONS.OCI_SYNC_LOGS_VIEW);
    await ensureOciSyncModuleLoaded();

    const container = getContainer();
    const getLogsUseCase = container.get<GetOciSyncLogsUseCase>(
      DI_TOKENS.GetOciSyncLogsUseCase,
    );

    const logs = await getLogsUseCase.execute(limit);

    return {
      success: true,
      data: presentSyncLogs(logs),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getOciSyncLogs" },
      "Failed to get OCI sync logs",
    );
  }
}

/**
 * Get latest sync status
 */
export async function getLatestOciSyncStatusAction(): Promise<
  ActionResponse<OciSyncLogDTO | null>
> {
  try {
    await requireFeature("OCI_SYNC");
    await requirePermission(PERMISSIONS.OCI_SYNC_VIEW);
    await ensureOciSyncModuleLoaded();

    const container = getContainer();
    const getLogsUseCase = container.get<GetOciSyncLogsUseCase>(
      DI_TOKENS.GetOciSyncLogsUseCase,
    );

    const logs = await getLogsUseCase.execute(1);
    const latest = logs[0] ?? null;

    return {
      success: true,
      data: latest ? presentSyncLog(latest) : null,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getLatestOciSyncStatus" },
      "Failed to get latest OCI sync status",
    );
  }
}
