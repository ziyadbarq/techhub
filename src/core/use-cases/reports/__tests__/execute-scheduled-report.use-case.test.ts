import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExecuteScheduledReportUseCase } from "../execute-scheduled-report.use-case";
import type { ReportScheduleProps } from "@/core/domain/entities/report-schedule.entity";
import type { IFeatureFlagRepository } from "@/core/repositories/feature-flag.repository.interface";
import type { IReportScheduleRepository } from "@/core/repositories/report-schedule.repository.interface";
import type { ICSVService } from "@/core/services/csv.service.interface";
import type { IEmailService } from "@/core/services/email.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IReportPdfService } from "@/core/services/report-pdf.service.interface";
import type { GenerateReportDataUseCase } from "../generate-report-data.use-case";

function buildSchedule(
  overrides: Partial<ReportScheduleProps> = {},
): ReportScheduleProps {
  const now = new Date("2026-04-01T08:00:00.000Z");
  return {
    id: overrides.id ?? "schedule-1",
    reportId: overrides.reportId ?? "asset-inventory-summary",
    name: overrides.name ?? "Daily Asset Inventory",
    frequency: overrides.frequency ?? "DAILY",
    dayOfWeek: overrides.dayOfWeek ?? null,
    dayOfMonth: overrides.dayOfMonth ?? null,
    hour: overrides.hour ?? 8,
    minute: overrides.minute ?? 0,
    timezone: overrides.timezone ?? "Asia/Riyadh",
    recipients: overrides.recipients ?? ["ops@barq.com"],
    filters: overrides.filters ?? null,
    format: overrides.format ?? "PDF",
    isActive: overrides.isActive ?? true,
    lastSentAt: overrides.lastSentAt ?? null,
    nextSendAt: overrides.nextSendAt ?? null,
    createdById: overrides.createdById ?? "person-1",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe("ExecuteScheduledReportUseCase", () => {
  let logger: ILoggerService;
  let featureFlagRepository: IFeatureFlagRepository;
  let csvService: ICSVService;
  let emailService: IEmailService;
  let pdfService: IReportPdfService;
  let repository: IReportScheduleRepository;
  let generateReportData: Pick<GenerateReportDataUseCase, "execute">;
  let useCase: ExecuteScheduledReportUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => logger),
      startTimer: vi.fn(() => ({
        startTime: Date.now(),
        operation: "test",
      })),
      endTimer: vi.fn(),
      audit: vi.fn(),
      withTiming: vi.fn(async (_operation, fn) => fn()),
    };

    featureFlagRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
      findAll: vi.fn(),
      findByNames: vi.fn(),
      findAllEnabled: vi.fn(),
      findDependentFlags: vi.fn(),
      getEnabledFeatureNames: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      setEnabled: vi.fn(),
      toggle: vi.fn(),
      delete: vi.fn(),
      existsByName: vi.fn(),
      isFeatureEnabled: vi.fn(),
      isMaintenanceModeEnabled: vi.fn(),
    };

    csvService = {
      exportToCSV: vi.fn().mockReturnValue("header\nvalue"),
      importFromCSV: vi.fn(),
      parseCSV: vi.fn(),
    };

    emailService = {
      sendEmail: vi.fn(),
      sendTemplatedEmail: vi.fn(),
      sendBatch: vi.fn(),
      testConnection: vi.fn(),
    };

    pdfService = {
      generateReportPdf: vi.fn().mockResolvedValue(Buffer.from("pdf")),
    };

    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findByCreatedBy: vi.fn(),
      findDueSchedules: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    generateReportData = {
      execute: vi.fn(),
    };

    useCase = new ExecuteScheduledReportUseCase(
      logger,
      featureFlagRepository,
      csvService,
      emailService,
      pdfService,
      repository,
      generateReportData as GenerateReportDataUseCase,
    );

    vi.mocked(featureFlagRepository.isFeatureEnabled).mockResolvedValue(true);
    vi.mocked(generateReportData.execute).mockResolvedValue({
      reportId: "asset-inventory-summary",
      rows: [{ categoryName: "Laptops", assetCount: 3, totalValue: 12000 }],
      totalRows: 1,
      summaryStats: [{ label: "Total Assets", value: 3 }],
      appliedFilters: {},
      generatedAt: new Date("2026-04-01T09:00:00.000Z"),
    });
  });

  it("restores the claimed due timestamp when every email delivery fails", async () => {
    const claimedNextSendAt = new Date("2026-04-01T05:00:00.000Z");
    vi.mocked(repository.findById).mockResolvedValue(
      buildSchedule({ nextSendAt: null }),
    );
    vi.mocked(repository.update).mockResolvedValue(buildSchedule());
    vi.mocked(emailService.sendEmail).mockRejectedValue(new Error("SMTP down"));

    await useCase.execute("schedule-1", claimedNextSendAt);

    expect(repository.update).toHaveBeenCalledWith("schedule-1", {
      nextSendAt: claimedNextSendAt,
    });
  });

  it("throws when the schedule is inactive so manual trigger surfaces the real error", async () => {
    vi.mocked(repository.findById).mockResolvedValue(
      buildSchedule({ isActive: false }),
    );

    await expect(useCase.execute("schedule-1")).rejects.toThrow(
      "Schedule is inactive",
    );
  });
});
