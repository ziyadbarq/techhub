/**
 * OCI Sync Log Repository Interface
 *
 * Defines the contract for persisting OCI sync operation logs.
 */

export interface OciSyncLogCreateInput {
  id: string;
  serviceTypes: string[];
  triggeredBy?: string;
  isDryRun: boolean;
}

export interface OciSyncLogUpdateInput {
  status?: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PARTIAL";
  tenancyId?: string;
  regions?: string[];
  resourcesProcessed?: number;
  resourcesCreated?: number;
  resourcesUpdated?: number;
  resourcesRetired?: number;
  resourcesUnchanged?: number;
  compartmentsCreated?: number;
  relationshipsCreated?: number;
  errorsCount?: number;
  errors?: unknown;
  completedAt?: Date;
  durationMs?: number;
}

export interface OciSyncLogRecord {
  id: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PARTIAL";
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
  errors: unknown;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  triggeredBy: string | null;
  isDryRun: boolean;
}

export interface IOciSyncLogRepository {
  create(input: OciSyncLogCreateInput): Promise<OciSyncLogRecord>;
  update(id: string, data: OciSyncLogUpdateInput): Promise<OciSyncLogRecord>;
  findById(id: string): Promise<OciSyncLogRecord | null>;
  findLatest(limit?: number): Promise<OciSyncLogRecord[]>;
}
