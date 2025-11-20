/**
 * Audit Log Presenter
 *
 * Transforms domain audit log entries into DTOs for presentation layer.
 */

import type { AuditLogEntry } from "@/core/repositories/audit-log-repository.interface";

/**
 * Audit Log DTO for presentation layer
 */
export interface AuditLogDTO {
  id: string;
  userId?: string;
  userName?: string; // Populated from User relation if available
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string; // ISO 8601 string
}

/**
 * Transform domain AuditLogEntry to AuditLogDTO
 */
export function toAuditLogDTO(entry: AuditLogEntry): AuditLogDTO {
  return {
    id: entry.id,
    userId: entry.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    changes: entry.changes,
    metadata: entry.metadata,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    createdAt: entry.createdAt.toISOString(),
  };
}

/**
 * Transform array of domain AuditLogEntry to array of AuditLogDTO
 */
export function toAuditLogDTOs(entries: AuditLogEntry[]): AuditLogDTO[] {
  return entries.map(toAuditLogDTO);
}

/**
 * Paginated audit logs response
 */
export interface PaginatedAuditLogsDTO {
  data: AuditLogDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
