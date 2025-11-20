/**
 * Audit Log DTOs (Data Transfer Objects)
 *
 * Zod schemas for validating Audit Log-related inputs.
 * Used in server actions to ensure type safety at runtime.
 */

import { z } from "zod";

/**
 * Schema for filtering audit logs
 */
export const AuditLogFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().optional().default(10),
});

export type AuditLogFilterDTO = z.infer<typeof AuditLogFilterSchema>;

/**
 * Schema for audit log entry output
 */
export const AuditLogEntrySchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().optional(),
  changes: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date({}),
});

export type AuditLogEntryDTO = z.infer<typeof AuditLogEntrySchema>;
