/**
 * AuditLog Repository Interface
 * Defines operations for audit log persistence
 */

import type { AuditLog as _AuditLog } from "../domain/entities/audit-log.entity";

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface FindAuditLogsParams {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface IAuditLogRepository {
  /**
   * Create a new audit log entry
   */
  create(params: CreateAuditLogParams): Promise<AuditLogEntry>;

  /**
   * Find audit logs with filters
   */
  find(params: FindAuditLogsParams): Promise<AuditLogEntry[]>;

  /**
   * Find audit logs for a specific user
   */
  findByUserId(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<AuditLogEntry[]>;

  /**
   * Find audit logs for a specific entity
   */
  findByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]>;

  /**
   * Find audit logs by action
   */
  findByAction(
    action: string,
    limit?: number,
    offset?: number,
  ): Promise<AuditLogEntry[]>;

  /**
   * Count total audit logs
   */
  count(params?: FindAuditLogsParams): Promise<number>;

  /**
   * Delete old audit logs (for cleanup)
   */
  deleteOlderThan(date: Date): Promise<number>;
}
