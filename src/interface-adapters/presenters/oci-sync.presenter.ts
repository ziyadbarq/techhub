/**
 * OCI Sync Presenter
 *
 * Transforms domain results to DTOs for the UI.
 */

import type { OciSyncResult } from "@/core/domain/value-objects/oci-resource.types";
import type { OciSyncLogRecord } from "@/core/repositories/oci-sync-log.repository.interface";
import type {
  OciSyncResultDTO,
  OciSyncLogDTO,
} from "@/interface-adapters/dtos/generated/oci-sync.dto";

export function presentSyncResult(result: OciSyncResult): OciSyncResultDTO {
  return {
    syncLogId: result.syncLogId,
    status: result.status,
    summary: result.summary,
    resourcesProcessed: result.resourcesProcessed,
    resourcesCreated: result.resourcesCreated,
    resourcesUpdated: result.resourcesUpdated,
    resourcesRetired: result.resourcesRetired,
    resourcesUnchanged: result.resourcesUnchanged,
    compartmentsCreated: result.compartmentsCreated,
    relationshipsCreated: result.relationshipsCreated,
    errorCount: result.errors.length,
    durationMs: result.durationMs,
  };
}

export function presentSyncLog(record: OciSyncLogRecord): OciSyncLogDTO {
  return {
    id: record.id,
    status: record.status,
    serviceTypes: record.serviceTypes,
    tenancyId: record.tenancyId,
    regions: record.regions,
    resourcesProcessed: record.resourcesProcessed,
    resourcesCreated: record.resourcesCreated,
    resourcesUpdated: record.resourcesUpdated,
    resourcesRetired: record.resourcesRetired,
    resourcesUnchanged: record.resourcesUnchanged,
    compartmentsCreated: record.compartmentsCreated,
    relationshipsCreated: record.relationshipsCreated,
    errorsCount: record.errorsCount,
    startedAt: record.startedAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
    durationMs: record.durationMs,
    triggeredBy: record.triggeredBy,
    isDryRun: record.isDryRun,
    latestIssue: getFirstSyncIssue(record.errors),
  };
}

export function presentSyncLogs(records: OciSyncLogRecord[]): OciSyncLogDTO[] {
  return records.map(presentSyncLog);
}

function getFirstSyncIssue(errors: unknown): string | null {
  if (!Array.isArray(errors)) return null;

  for (const item of errors) {
    if (
      typeof item === "object" &&
      item !== null &&
      "error" in item &&
      typeof item.error === "string"
    ) {
      return item.error;
    }
  }

  return null;
}
