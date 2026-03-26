/**
 * OCI Sync DTOs
 *
 * Zod schemas for input validation and output presentation.
 */

import { z } from "zod/v4";
import { OCI_SERVICE_KEYS } from "@/core/domain/value-objects/oci-resource.types";

// ========================================
// Input DTOs
// ========================================

export const TriggerOciSyncSchema = z.object({
  serviceKeys: z.array(z.enum(OCI_SERVICE_KEYS)).optional(),
  dryRun: z.boolean().optional().default(false),
});

export type TriggerOciSyncDTO = z.infer<typeof TriggerOciSyncSchema>;

// ========================================
// Output DTOs
// ========================================

export interface OciSyncResultDTO {
  syncLogId: string;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  summary: string;
  resourcesProcessed: number;
  resourcesCreated: number;
  resourcesUpdated: number;
  resourcesRetired: number;
  resourcesUnchanged: number;
  compartmentsCreated: number;
  relationshipsCreated: number;
  errorCount: number;
  durationMs: number;
}

export interface OciSyncLogDTO {
  id: string;
  status: string;
  serviceTypes: string[];
  tenancyId: string | null;
  regions: string[];
  resourcesProcessed: number;
  resourcesCreated: number;
  resourcesUpdated: number;
  resourcesRetired: number;
  resourcesUnchanged: number;
  compartmentsCreated: number;
  relationshipsCreated: number;
  errorsCount: number;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  triggeredBy: string | null;
  isDryRun: boolean;
  latestIssue: string | null;
}
