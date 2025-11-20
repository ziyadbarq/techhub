/**
 * Audit Log Controller
 *
 * Server actions for Audit Log operations.
 * Demonstrates Clean Architecture controller pattern with:
 * - Dependency injection via container
 * - Input validation with Zod
 * - Centralized error handling
 * - Presentation layer transformation
 * - Pagination support
 * - Permission-based access control
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  AuditLogFilterSchema,
  type AuditLogFilterDTO,
} from "../dtos/audit-log.dto";
import {
  toAuditLogDTOs,
  type AuditLogDTO,
  type PaginatedAuditLogsDTO,
} from "../presenters/audit-log.presenter";
import type {
  ListAuditLogsUseCase,
  CountAuditLogsUseCase,
} from "@/core/use-cases/audit-log";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

/**
 * List audit logs with optional filtering and pagination
 */
export async function listAuditLogsAction(
  filter?: AuditLogFilterDTO,
): Promise<ActionResponse<PaginatedAuditLogsDTO>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW);

    // Validate filter if provided
    const validated = filter
      ? AuditLogFilterSchema.parse(filter)
      : AuditLogFilterSchema.parse({});

    // Calculate pagination
    const page = validated.page ?? 1;
    const pageSize = validated.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    // Prepare repository filter params
    const filterParams = {
      userId: validated.userId,
      action: validated.action,
      entityType: validated.entityType,
      entityId: validated.entityId,
      startDate: validated.startDate
        ? new Date(validated.startDate)
        : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      limit: pageSize,
      offset,
    };

    // Get use cases from DI container
    const container = getContainer();
    const listAuditLogs = container.get<ListAuditLogsUseCase>(
      DI_TOKENS.ListAuditLogsUseCase,
    );
    const countAuditLogs = container.get<CountAuditLogsUseCase>(
      DI_TOKENS.CountAuditLogsUseCase,
    );

    // Execute use cases in parallel
    const [entries, total] = await Promise.all([
      listAuditLogs.execute(filterParams),
      countAuditLogs.execute(filterParams),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    // Transform to DTOs
    return {
      success: true,
      data: {
        data: toAuditLogDTOs(entries),
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAuditLogsAction" },
      "Failed to fetch audit logs",
    );
  }
}

/**
 * Get unique action types for filter dropdown
 */
export async function getAuditLogActionsAction(): Promise<
  ActionResponse<string[]>
> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW);

    const container = getContainer();
    const listAuditLogs = container.get<ListAuditLogsUseCase>(
      DI_TOKENS.ListAuditLogsUseCase,
    );

    // Fetch all logs (limited) to extract unique actions
    const entries = await listAuditLogs.execute({ limit: 1000 });
    const uniqueActions = Array.from(
      new Set(entries.map((entry) => entry.action)),
    ).sort();

    return {
      success: true,
      data: uniqueActions,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAuditLogActionsAction" },
      "Failed to fetch audit log actions",
    );
  }
}

/**
 * Get unique entity types for filter dropdown
 */
export async function getAuditLogEntityTypesAction(): Promise<
  ActionResponse<string[]>
> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW);

    const container = getContainer();
    const listAuditLogs = container.get<ListAuditLogsUseCase>(
      DI_TOKENS.ListAuditLogsUseCase,
    );

    // Fetch all logs (limited) to extract unique entity types
    const entries = await listAuditLogs.execute({ limit: 1000 });
    const uniqueEntityTypes = Array.from(
      new Set(entries.map((entry) => entry.entityType)),
    ).sort();

    return {
      success: true,
      data: uniqueEntityTypes,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAuditLogEntityTypesAction" },
      "Failed to fetch audit log entity types",
    );
  }
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogsAction(
  filter?: AuditLogFilterDTO,
): Promise<ActionResponse<AuditLogDTO[]>> {
  try {
    // Check permission
    await requirePermission(PERMISSIONS.AUDIT_LOGS_EXPORT);

    // Validate filter if provided
    const validated = filter
      ? AuditLogFilterSchema.parse(filter)
      : AuditLogFilterSchema.parse({});

    // Prepare repository filter params (no pagination for export)
    const filterParams = {
      userId: validated.userId,
      action: validated.action,
      entityType: validated.entityType,
      entityId: validated.entityId,
      startDate: validated.startDate
        ? new Date(validated.startDate)
        : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    };

    // Get use case from DI container
    const container = getContainer();
    const listAuditLogs = container.get<ListAuditLogsUseCase>(
      DI_TOKENS.ListAuditLogsUseCase,
    );

    // Execute use case (fetch all matching records)
    const entries = await listAuditLogs.execute(filterParams);

    // Transform to DTOs
    return {
      success: true,
      data: toAuditLogDTOs(entries),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "exportAuditLogsAction" },
      "Failed to export audit logs",
    );
  }
}
