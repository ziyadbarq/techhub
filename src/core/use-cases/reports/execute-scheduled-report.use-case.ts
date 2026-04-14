/**
 * Execute Scheduled Report Use Case
 *
 * Called by BullMQ handler. Generates report data,
 * creates PDF/CSV/XLSX, sends via email, updates schedule.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IFeatureFlagRepository } from "@/core/repositories/feature-flag.repository.interface";
import type { ICSVService } from "@/core/services/csv.service.interface";
import type { IEmailService } from "@/core/services/email.service.interface";
import type { IReportPdfService } from "@/core/services/report-pdf.service.interface";
import type { IReportScheduleRepository } from "@/core/repositories/report-schedule.repository.interface";
import { LogExecution } from "@/lib/decorators";
import { ReportScheduleEntity } from "@/core/domain/entities/report-schedule.entity";
import { getReportDefinition } from "@/core/domain/reports/report-definitions";
import type { ReportFilterValues } from "@/core/domain/reports/report-types";
import type { GenerateReportDataUseCase } from "./generate-report-data.use-case";
import * as XLSX from "xlsx";

@injectable()
export class ExecuteScheduledReportUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IFeatureFlagRepository)
    private readonly featureFlagRepository: IFeatureFlagRepository,
    @inject(DI_TOKENS.ICSVService)
    private readonly csvService: ICSVService,
    @inject(DI_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
    @inject(DI_TOKENS.IReportPdfService)
    private readonly pdfService: IReportPdfService,
    @inject(DI_TOKENS.IReportScheduleRepository)
    private readonly repository: IReportScheduleRepository,
    @inject(DI_TOKENS.GenerateReportDataUseCase)
    private readonly generateReportData: GenerateReportDataUseCase,
  ) {}

  @LogExecution("reports.schedule.execute")
  async execute(
    scheduleId: string,
    claimedNextSendAt?: Date | null,
  ): Promise<void> {
    const scheduleData = await this.repository.findById(scheduleId);
    if (!scheduleData) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    if (!scheduleData.isActive) {
      throw new Error("Schedule is inactive");
    }

    const definition = getReportDefinition(scheduleData.reportId);
    if (!definition) {
      throw new Error(`Report definition not found: ${scheduleData.reportId}`);
    }

    // Check if required feature flags are still enabled
    for (const flag of definition.requiredFeatureFlags) {
      const enabled = await this.featureFlagRepository.isFeatureEnabled(flag);
      if (!enabled) {
        this.logger.info("Required feature flag disabled, skipping", {
          scheduleId,
          flag,
        });
        // Still update nextSendAt so we don't retry every 15 minutes
        const entity = ReportScheduleEntity.fromPersistence(scheduleData);
        const marked = entity.markSent();
        await this.repository.update(scheduleId, {
          nextSendAt: marked.nextSendAt,
        });
        return;
      }
    }

    const filters = (scheduleData.filters ?? {}) as ReportFilterValues;
    const result = await this.generateReportData.execute(
      scheduleData.reportId,
      filters,
    );

    // Generate attachment based on format
    let attachmentBuffer: Buffer;
    let attachmentFilename: string;
    let contentType: string;
    const dateStr = new Date().toISOString().slice(0, 10);

    switch (scheduleData.format) {
      case "PDF":
        attachmentBuffer = await this.pdfService.generateReportPdf({
          title: definition.name,
          description: definition.description,
          filters: result.appliedFilters,
          columns: definition.columns,
          rows: result.rows,
          summaryStats: result.summaryStats,
          generatedAt: result.generatedAt,
          generatedBy: "Scheduled Report",
        });
        attachmentFilename = `${scheduleData.reportId}-${dateStr}.pdf`;
        contentType = "application/pdf";
        break;

      case "CSV": {
        const fields = definition.columns.map((column) => column.key);
        const headers = Object.fromEntries(
          definition.columns.map((column) => [column.key, column.label]),
        );
        const csv = this.csvService.exportToCSV(
          result.rows as Record<string, unknown>[],
          { fields, headers },
        );
        attachmentBuffer = Buffer.from(csv, "utf-8");
        attachmentFilename = `${scheduleData.reportId}-${dateStr}.csv`;
        contentType = "text/csv";
        break;
      }

      case "XLSX": {
        // Build rows with column labels as keys
        const xlsxRows = result.rows.map((row) => {
          const mapped: Record<string, unknown> = {};
          for (const col of definition.columns) {
            mapped[col.label] = row[col.key] ?? "";
          }
          return mapped;
        });
        const worksheet = XLSX.utils.json_to_sheet(xlsxRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        const xlsxBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "buffer",
        }) as Buffer;
        attachmentBuffer = xlsxBuffer;
        attachmentFilename = `${scheduleData.reportId}-${dateStr}.xlsx`;
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      }
    }

    // Send email to all recipients
    const tz = scheduleData.timezone || "Asia/Riyadh";
    const subject = `[barq TechHub] ${definition.name} — ${dateStr}`;
    const generatedTime = formatInTimezone(result.generatedAt, tz);

    const frequencyLabel =
      scheduleData.frequency === "DAILY"
        ? "Daily"
        : scheduleData.frequency === "WEEKLY"
          ? "Weekly"
          : "Monthly";

    const summaryRows = result.summaryStats
      .map(
        (s) =>
          `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;">${s.label}</td><td style="padding:6px 0;font-weight:600;">${s.value}</td></tr>`,
      )
      .join("");

    const filterEntries = Object.entries(result.appliedFilters).filter(
      ([, v]) => v && v !== "",
    );
    const filtersHtml =
      filterEntries.length > 0
        ? `<p style="margin:0 0 16px;color:#6b7280;font-size:13px;">Filters: ${filterEntries.map(([k, v]) => `${k}=${v}`).join(", ")}</p>`
        : "";

    const body = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#1e2024;padding:24px 32px;">
            <span style="color:#ffda00;font-size:22px;font-weight:700;letter-spacing:0.5px;">barq</span>
            <span style="color:#ffffff;font-size:14px;margin-left:12px;">TechHub Reports</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 4px;font-size:20px;color:#1e2024;">${definition.name}</h1>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">${definition.description}</p>

            ${filtersHtml}

            <!-- Summary Stats -->
            ${
              summaryRows
                ? `<table style="margin:0 0 24px;font-size:14px;border-collapse:collapse;">${summaryRows}</table>`
                : ""
            }

            <!-- Report Info -->
            <table style="width:100%;border-collapse:collapse;font-size:13px;color:#6b7280;margin:0 0 24px;">
              <tr>
                <td style="padding:8px 0;border-top:1px solid #e5e7eb;">Records</td>
                <td style="padding:8px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:600;color:#1e2024;">${result.rows.length.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-top:1px solid #e5e7eb;">Format</td>
                <td style="padding:8px 0;border-top:1px solid #e5e7eb;text-align:right;">${scheduleData.format}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-top:1px solid #e5e7eb;">Schedule</td>
                <td style="padding:8px 0;border-top:1px solid #e5e7eb;text-align:right;">${frequencyLabel}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-top:1px solid #e5e7eb;">Generated</td>
                <td style="padding:8px 0;border-top:1px solid #e5e7eb;text-align:right;">${generatedTime}</td>
              </tr>
            </table>

            <p style="margin:0;padding:12px 16px;background:#dff5f7;border-radius:6px;font-size:13px;color:#1e2024;">
              The full report is attached as a <strong>${scheduleData.format}</strong> file. Open the attachment for complete data.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              This is an automated report from barq TechHub. To manage your report schedules, visit the Reports section in TechHub.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

    let successCount = 0;
    for (const recipient of scheduleData.recipients) {
      try {
        await this.emailService.sendEmail({
          to: recipient,
          subject,
          body,
          attachments: [
            {
              filename: attachmentFilename,
              content: attachmentBuffer,
              contentType,
            },
          ],
        });
        successCount++;
      } catch (error) {
        this.logger.error(
          "Failed to send scheduled report email",
          error instanceof Error ? error : undefined,
          {
            scheduleId,
            recipient,
          },
        );
      }
    }

    // Always recompute nextSendAt (checker clears it to claim the job).
    const entity = ReportScheduleEntity.fromPersistence(scheduleData);
    const marked = entity.markSent();

    if (successCount > 0) {
      // At least one delivery succeeded — advance lastSentAt + nextSendAt
      await this.repository.update(scheduleId, {
        lastSentAt: marked.lastSentAt,
        nextSendAt: marked.nextSendAt,
      });
    } else {
      // Restore the claimed due time so the checker will retry this missed slot
      // on its next pass instead of skipping ahead to the next cadence window.
      const retryNextSendAt = claimedNextSendAt ?? scheduleData.nextSendAt;
      await this.repository.update(scheduleId, {
        nextSendAt: retryNextSendAt,
      });
      this.logger.warn(
        "All email deliveries failed, restored schedule for retry",
        {
          scheduleId,
          recipientCount: scheduleData.recipients.length,
          retryNextSendAt: retryNextSendAt?.toISOString() ?? null,
        },
      );
    }

    this.logger.info("Scheduled report executed", {
      scheduleId,
      reportId: scheduleData.reportId,
      recipients: scheduleData.recipients.length,
      format: scheduleData.format,
      rows: result.rows.length,
    });
  }
}

/**
 * Format a date in the given IANA timezone (e.g. "Asia/Riyadh").
 * Returns something like "2026-03-31 17:00 (Arabia Standard Time)"
 */
function formatInTimezone(date: Date, tz: string): string {
  try {
    const formatted = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);

    const tzName =
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "short",
      })
        .formatToParts(date)
        .find((p) => p.type === "timeZoneName")?.value ?? tz;

    return `${formatted} (${tzName})`;
  } catch {
    // Invalid timezone — fall back to ISO
    return date.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  }
}
