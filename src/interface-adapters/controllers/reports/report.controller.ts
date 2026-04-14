/**
 * Report Controller
 * Server actions for running reports, exporting, and managing schedules
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "../types";
import { handleControllerError } from "../error-handler";
import { isFeatureEnabled, requireFeature } from "@/lib/features/server";
import {
  hasAny,
  hasPermission,
  requirePermission,
} from "@/lib/permissions/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import type { FeatureFlagKey } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { GetReportCatalogUseCase } from "@/core/use-cases/reports/get-report-catalog.use-case";
import type { GenerateReportDataUseCase } from "@/core/use-cases/reports/generate-report-data.use-case";
import type { CreateReportScheduleUseCase } from "@/core/use-cases/reports/create-report-schedule.use-case";
import type { ListReportSchedulesUseCase } from "@/core/use-cases/reports/list-report-schedules.use-case";
import type { DeleteReportScheduleUseCase } from "@/core/use-cases/reports/delete-report-schedule.use-case";
import type {
  ReportDefinition,
  ReportResult,
} from "@/core/domain/reports/report-types";
import {
  ReportScheduleEntity,
  type ReportScheduleProps,
} from "@/core/domain/entities/report-schedule.entity";
import type { IReportScheduleRepository } from "@/core/repositories/report-schedule.repository.interface";
import type { IReportPdfService } from "@/core/services/report-pdf.service.interface";
import type { IReportDataService } from "@/core/services/report-data.service.interface";
import type { ExecuteScheduledReportUseCase } from "@/core/use-cases/reports/execute-scheduled-report.use-case";
import { getSession, getCurrentUserId } from "@/lib/auth/session";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import {
  RunReportDto,
  ExportReportDto,
} from "@/interface-adapters/dtos/reports/report.dto";
import { arrayToCSV } from "@/lib/csv-export";
import { getReportDefinition } from "@/core/domain/reports/report-definitions";
import type {
  ReportFilterOption,
  FilterOptionsSource,
} from "@/core/domain/reports/report-types";

/**
 * Validate that a specific report exists and its required feature flags are enabled.
 * Call this in any action that accepts a reportId to prevent access to reports
 * whose module is disabled (e.g. CMDB reports when CMDB flag is off).
 */
async function assertReportAccess(reportId: string): Promise<void> {
  const definition = getReportDefinition(reportId);
  if (!definition) {
    throw new Error(`Unknown report: ${reportId}`);
  }
  for (const flag of definition.requiredFeatureFlags) {
    const enabled = await isFeatureEnabled(flag as FeatureFlagKey);
    if (!enabled) {
      throw new Error(
        `Report "${definition.name}" requires the ${flag} feature to be enabled`,
      );
    }
  }
}

/**
 * Get available report catalog (filtered by enabled feature flags)
 */
export async function getReportCatalogAction(): Promise<
  ActionResponse<ReportDefinition[]>
> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetReportCatalogUseCase>(
      DI_TOKENS.GetReportCatalogUseCase,
    );

    const reports = await useCase.execute();
    return { success: true, data: reports };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getReportCatalogAction" },
      "Failed to load report catalog",
    );
  }
}

/**
 * Run a specific report with filters
 */
export async function runReportAction(
  input: unknown,
): Promise<ActionResponse<ReportResult>> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_VIEW);

    const validated = RunReportDto.parse(input);
    await assertReportAccess(validated.reportId);

    const container = getContainer();
    const useCase = container.get<GenerateReportDataUseCase>(
      DI_TOKENS.GenerateReportDataUseCase,
    );

    const result = await useCase.execute(
      validated.reportId,
      validated.filters ?? {},
    );

    return { success: true, data: result };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "runReportAction" },
      "Failed to run report",
    );
  }
}

/**
 * Export report data as CSV string (respects column visibility)
 */
export async function exportReportCsvAction(
  input: unknown,
): Promise<ActionResponse<string>> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_EXPORT);

    const validated = ExportReportDto.parse(input);
    await assertReportAccess(validated.reportId);
    const hiddenSet = new Set(validated.hiddenColumns ?? []);

    const container = getContainer();
    const useCase = container.get<GenerateReportDataUseCase>(
      DI_TOKENS.GenerateReportDataUseCase,
    );

    const result = await useCase.execute(
      validated.reportId,
      validated.filters ?? {},
    );

    // Sort rows to match UI sort order
    const rows = sortRows(result.rows, validated.sortKey, validated.sortAsc);

    // Build column mappings, excluding hidden columns
    const definition = getReportDefinition(validated.reportId);
    const columns = (definition?.columns ?? [])
      .filter((col) => !hiddenSet.has(col.key))
      .map((col) => ({
        key: col.key,
        label: col.label,
      }));

    const csvString = arrayToCSV(
      rows as Record<string, string | number | boolean | null | undefined>[],
      columns,
    );

    return { success: true, data: csvString };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "exportReportCsvAction" },
      "Failed to export report as CSV",
    );
  }
}

/**
 * Export report as PDF (returns base64-encoded PDF, respects column visibility)
 */
export async function exportReportPdfAction(
  input: unknown,
): Promise<ActionResponse<{ base64: string; filename: string }>> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_EXPORT);

    const validated = ExportReportDto.parse(input);
    await assertReportAccess(validated.reportId);
    const hiddenSet = new Set(validated.hiddenColumns ?? []);

    const session = await getSession();
    const generatedBy = session?.user?.email ?? "Unknown";

    // Generate report data
    const container = getContainer();
    const dataUseCase = container.get<GenerateReportDataUseCase>(
      DI_TOKENS.GenerateReportDataUseCase,
    );
    const result = await dataUseCase.execute(
      validated.reportId,
      validated.filters ?? {},
    );

    // Sort rows + filter columns for PDF
    const sortedRows = sortRows(
      result.rows,
      validated.sortKey,
      validated.sortAsc,
    );
    const definition = getReportDefinition(validated.reportId);
    if (!definition) throw new Error(`Unknown report: ${validated.reportId}`);

    const visibleColumns = definition.columns.filter(
      (col) => !hiddenSet.has(col.key),
    );

    const pdfService = container.get<IReportPdfService>(
      DI_TOKENS.IReportPdfService,
    );

    const description =
      visibleColumns.length < definition.columns.length
        ? `${definition.name} showing: ${visibleColumns.map((c) => c.label).join(", ")}.`
        : definition.description;

    // Filter summary stats by visible columns
    const visibleColumnKeys = new Set(visibleColumns.map((c) => c.key));
    const visibleStats = result.summaryStats.filter(
      (stat) => !stat.columnKey || visibleColumnKeys.has(stat.columnKey),
    );

    const pdfBuffer = await pdfService.generateReportPdf({
      title: definition.name,
      description,
      filters: result.appliedFilters,
      columns: visibleColumns,
      rows: sortedRows,
      summaryStats: visibleStats,
      generatedAt: result.generatedAt,
      generatedBy,
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${validated.reportId}-${dateStr}.pdf`;

    return {
      success: true,
      data: {
        base64: pdfBuffer.toString("base64"),
        filename,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "exportReportPdfAction" },
      "Failed to export report as PDF",
    );
  }
}

// ============================================================================
// Schedule Management
// ============================================================================

/**
 * Create a report schedule
 */
export async function createReportScheduleAction(
  input: unknown,
): Promise<ActionResponse<ReportScheduleProps>> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requireScheduleManagementAccess();

    const data = input as Record<string, unknown>;
    await assertReportAccess(String(data.reportId ?? ""));

    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");

    const container = getContainer();

    // Resolve auth User ID → Person ID (FK targets Person table)
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const person = await personRepository.findByUserId(userId);
    if (!person)
      throw new Error("No linked Person record found for current user");

    const useCase = container.get<CreateReportScheduleUseCase>(
      DI_TOKENS.CreateReportScheduleUseCase,
    );

    const schedule = await useCase.execute({
      reportId: String(data.reportId ?? ""),
      name: String(data.name ?? ""),
      frequency: String(data.frequency ?? "DAILY") as
        | "DAILY"
        | "WEEKLY"
        | "MONTHLY",
      dayOfWeek: data.dayOfWeek != null ? Number(data.dayOfWeek) : undefined,
      dayOfMonth: data.dayOfMonth != null ? Number(data.dayOfMonth) : undefined,
      hour: data.hour != null ? Number(data.hour) : undefined,
      minute: data.minute != null ? Number(data.minute) : undefined,
      timezone: data.timezone ? String(data.timezone) : undefined,
      recipients: Array.isArray(data.recipients)
        ? data.recipients.map(String)
        : [],
      filters: data.filters as Record<string, unknown> | undefined,
      format: data.format
        ? (String(data.format) as "PDF" | "CSV" | "XLSX")
        : undefined,
      createdById: person.id,
    });

    return { success: true, data: schedule };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createReportScheduleAction" },
      "Failed to create report schedule",
    );
  }
}

/**
 * List current user's report schedules
 */
export async function listMyReportSchedulesAction(): Promise<
  ActionResponse<ReportScheduleProps[]>
> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requireScheduleManagementAccess();

    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");

    const container = getContainer();

    // Resolve auth User ID → Person ID
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const person = await personRepository.findByUserId(userId);
    if (!person) return { success: true, data: [] };

    const useCase = container.get<ListReportSchedulesUseCase>(
      DI_TOKENS.ListReportSchedulesUseCase,
    );

    const schedules = await useCase.execute(person.id);
    return { success: true, data: schedules };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listMyReportSchedulesAction" },
      "Failed to list report schedules",
    );
  }
}

/**
 * Delete a report schedule
 */
export async function deleteReportScheduleAction(
  scheduleId: string,
): Promise<ActionResponse<void>> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requireScheduleManagementAccess();

    const container = getContainer();
    const repository = container.get<IReportScheduleRepository>(
      DI_TOKENS.IReportScheduleRepository,
    );
    const existing = await repository.findById(scheduleId);
    if (!existing) throw new Error("Schedule not found");

    await assertScheduleOwnership(existing, container);

    const useCase = container.get<DeleteReportScheduleUseCase>(
      DI_TOKENS.DeleteReportScheduleUseCase,
    );

    await useCase.execute(scheduleId);
    return { success: true, data: undefined };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteReportScheduleAction" },
      "Failed to delete report schedule",
    );
  }
}

/**
 * List all report schedules (admin) or current user's schedules
 * Admins (REPORTS_MANAGE) see all, others see their own
 */
export async function listAllReportSchedulesAction(): Promise<
  ActionResponse<ReportScheduleProps[]>
> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_MANAGE);

    const container = getContainer();
    const repository = container.get<IReportScheduleRepository>(
      DI_TOKENS.IReportScheduleRepository,
    );

    const schedules = await repository.findAll();
    return { success: true, data: schedules };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAllReportSchedulesAction" },
      "Failed to list all report schedules",
    );
  }
}

/**
 * Toggle a report schedule active/inactive.
 * REPORTS_SCHEDULE users can toggle their own; REPORTS_MANAGE can toggle any.
 */
export async function toggleReportScheduleAction(
  scheduleId: string,
): Promise<ActionResponse<ReportScheduleProps>> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requireScheduleManagementAccess();

    const container = getContainer();
    const repository = container.get<IReportScheduleRepository>(
      DI_TOKENS.IReportScheduleRepository,
    );

    const existing = await repository.findById(scheduleId);
    if (!existing) throw new Error("Schedule not found");

    await assertScheduleOwnership(existing, container);

    const entity = ReportScheduleEntity.fromPersistence(existing);
    const toggled = entity.toggle();
    const updated = await repository.update(
      scheduleId,
      toggled.toPlainObject(),
    );

    return { success: true, data: updated };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "toggleReportScheduleAction" },
      "Failed to toggle report schedule",
    );
  }
}

/**
 * Update a report schedule.
 * REPORTS_SCHEDULE users can update their own; REPORTS_MANAGE can update any.
 * Routes through domain entity for validation and nextSendAt recomputation.
 */
export async function updateReportScheduleAction(
  scheduleId: string,
  input: unknown,
): Promise<ActionResponse<ReportScheduleProps>> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requireScheduleManagementAccess();

    const data = input as Record<string, unknown>;

    const container = getContainer();
    const repository = container.get<IReportScheduleRepository>(
      DI_TOKENS.IReportScheduleRepository,
    );

    const existing = await repository.findById(scheduleId);
    if (!existing) throw new Error("Schedule not found");

    await assertScheduleOwnership(existing, container);

    const entity = ReportScheduleEntity.fromPersistence(existing);
    const changed = entity.applyUpdate({
      name: data.name != null ? String(data.name) : undefined,
      frequency: data.frequency
        ? (String(data.frequency) as "DAILY" | "WEEKLY" | "MONTHLY")
        : undefined,
      dayOfWeek: data.dayOfWeek != null ? Number(data.dayOfWeek) : undefined,
      dayOfMonth: data.dayOfMonth != null ? Number(data.dayOfMonth) : undefined,
      hour: data.hour != null ? Number(data.hour) : undefined,
      format: data.format
        ? (String(data.format) as "PDF" | "CSV" | "XLSX")
        : undefined,
      recipients: Array.isArray(data.recipients)
        ? data.recipients.map(String)
        : undefined,
    });
    const updated = await repository.update(
      scheduleId,
      changed.toPlainObject(),
    );

    return { success: true, data: updated };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateReportScheduleAction" },
      "Failed to update report schedule",
    );
  }
}

/**
 * Manually trigger a scheduled report (execute immediately)
 */
export async function triggerReportScheduleAction(
  scheduleId: string,
): Promise<ActionResponse<void>> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requireScheduleManagementAccess();

    const container = getContainer();
    const repository = container.get<IReportScheduleRepository>(
      DI_TOKENS.IReportScheduleRepository,
    );
    const existing = await repository.findById(scheduleId);
    if (!existing) throw new Error("Schedule not found");

    await assertScheduleOwnership(existing, container);

    const useCase = container.get<ExecuteScheduledReportUseCase>(
      DI_TOKENS.ExecuteScheduledReportUseCase,
    );

    await useCase.execute(scheduleId);
    return { success: true, data: undefined };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "triggerReportScheduleAction" },
      "Failed to trigger report schedule",
    );
  }
}

/**
 * Load dynamic filter options from the database
 */
export async function getFilterOptionsAction(
  source: FilterOptionsSource,
): Promise<ActionResponse<ReportFilterOption[]>> {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_VIEW);

    // Gate by underlying module feature flag
    const SOURCE_FEATURE_MAP: Partial<
      Record<FilterOptionsSource, FeatureFlagKey>
    > = {
      assetCategories: "ASSETS",
      lifecycleStates: "FOUNDATION",
      departments: "FOUNDATION",
      stockLocations: "ASSETS",
      vendors: "FOUNDATION",
      ciClasses: "CMDB",
      relationshipTypes: "CMDB",
    };
    const requiredFlag = SOURCE_FEATURE_MAP[source];
    if (requiredFlag) {
      const flagEnabled = await isFeatureEnabled(requiredFlag);
      if (!flagEnabled) {
        return { success: true, data: [] };
      }
    }

    const container = getContainer();
    const reportDataService = container.get<IReportDataService>(
      DI_TOKENS.IReportDataService,
    );
    const options = await reportDataService.getFilterOptions(source);

    return { success: true, data: options };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getFilterOptionsAction" },
      "Failed to load filter options",
    );
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Enforce schedule ownership: REPORTS_MANAGE can access any schedule,
 * REPORTS_SCHEDULE can only access their own.
 */
async function assertScheduleOwnership(
  schedule: ReportScheduleProps,
  container: ReturnType<typeof getContainer>,
): Promise<void> {
  const isAdmin = await hasPermission(PERMISSIONS.REPORTS_MANAGE);
  if (isAdmin) return;

  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const personRepository = container.get<IPersonRepository>(
    DI_TOKENS.IPersonRepository,
  );
  const person = await personRepository.findByUserId(userId);
  if (!person) throw new Error("No linked Person record");

  const entity = ReportScheduleEntity.fromPersistence(schedule);
  if (!entity.isOwnedBy(person.id)) {
    throw new Error("You do not have permission to modify this schedule");
  }
}

async function requireScheduleManagementAccess(): Promise<void> {
  const allowed = await hasAny([
    PERMISSIONS.REPORTS_SCHEDULE,
    PERMISSIONS.REPORTS_MANAGE,
  ]);
  if (allowed) {
    return;
  }

  await requirePermission(PERMISSIONS.REPORTS_SCHEDULE);
}

/**
 * Sort report rows by a column key, matching the UI sort order.
 */
function sortRows(
  rows: Record<string, unknown>[],
  sortKey?: string,
  sortAsc?: boolean,
): Record<string, unknown>[] {
  if (!sortKey) return rows;
  const asc = sortAsc ?? true;

  return [...rows].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return asc ? 1 : -1;
    if (bVal == null) return asc ? -1 : 1;
    if (typeof aVal === "number" && typeof bVal === "number") {
      return asc ? aVal - bVal : bVal - aVal;
    }
    const strA = String(aVal);
    const strB = String(bVal);
    return asc ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });
}
