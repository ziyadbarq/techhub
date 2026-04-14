import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteReportScheduleAction,
  triggerReportScheduleAction,
} from "../reports/report.controller";
import type { ReportScheduleProps } from "@/core/domain/entities/report-schedule.entity";

const {
  mockDeleteReportScheduleUseCase,
  mockExecuteScheduledReportUseCase,
  mockReportScheduleRepository,
  mockPersonRepository,
  mockLogger,
  mockHasAny,
  mockHasPermission,
  mockRequirePermission,
  mockRequireFeature,
  mockGetCurrentUserId,
} = vi.hoisted(() => ({
  mockDeleteReportScheduleUseCase: {
    execute: vi.fn(),
  },
  mockExecuteScheduledReportUseCase: {
    execute: vi.fn(),
  },
  mockReportScheduleRepository: {
    findById: vi.fn(),
  },
  mockPersonRepository: {
    findByUserId: vi.fn(),
  },
  mockLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    startTimer: vi.fn(() => ({ startTime: Date.now() })),
    endTimer: vi.fn(),
  },
  mockHasAny: vi.fn(),
  mockHasPermission: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockRequireFeature: vi.fn(),
  mockGetCurrentUserId: vi.fn(),
}));

vi.mock("@/lib/features/server", () => ({
  requireFeature: (...args: unknown[]) => mockRequireFeature(...args),
  isFeatureEnabled: vi.fn(),
}));

vi.mock("@/lib/permissions/server", () => ({
  hasAny: (...args: unknown[]) => mockHasAny(...args),
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUserId: () => mockGetCurrentUserId(),
  getSession: vi.fn(),
}));

vi.mock("@/infrastructure/database/prisma/client", () => ({
  prisma: {},
}));

vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("DeleteReportScheduleUseCase").toString()) {
        return mockDeleteReportScheduleUseCase;
      }
      if (tokenKey === Symbol.for("ExecuteScheduledReportUseCase").toString()) {
        return mockExecuteScheduledReportUseCase;
      }
      if (tokenKey === Symbol.for("IReportScheduleRepository").toString()) {
        return mockReportScheduleRepository;
      }
      if (tokenKey === Symbol.for("IPersonRepository").toString()) {
        return mockPersonRepository;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

function buildSchedule(
  overrides: Partial<ReportScheduleProps> = {},
): ReportScheduleProps {
  const now = new Date("2026-04-01T08:00:00.000Z");
  return {
    id: overrides.id ?? "schedule-1",
    reportId: overrides.reportId ?? "asset-inventory-summary",
    name: overrides.name ?? "Weekly Asset Report",
    frequency: overrides.frequency ?? "WEEKLY",
    dayOfWeek: overrides.dayOfWeek ?? 1,
    dayOfMonth: overrides.dayOfMonth ?? null,
    hour: overrides.hour ?? 8,
    minute: overrides.minute ?? 0,
    timezone: overrides.timezone ?? "Asia/Riyadh",
    recipients: overrides.recipients ?? ["owner@barq.com"],
    filters: overrides.filters ?? null,
    format: overrides.format ?? "PDF",
    isActive: overrides.isActive ?? true,
    lastSentAt: overrides.lastSentAt ?? null,
    nextSendAt: overrides.nextSendAt ?? now,
    createdById: overrides.createdById ?? "person-owner",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe("Report Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasAny.mockResolvedValue(true);
    mockHasPermission.mockResolvedValue(false);
    mockRequireFeature.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue(undefined);
    mockGetCurrentUserId.mockResolvedValue("user-1");
  });

  it("allows a schedule owner with reports:schedule to delete their own schedule", async () => {
    mockReportScheduleRepository.findById.mockResolvedValue(
      buildSchedule({ createdById: "person-owner" }),
    );
    mockPersonRepository.findByUserId.mockResolvedValue({ id: "person-owner" });
    mockDeleteReportScheduleUseCase.execute.mockResolvedValue(undefined);

    const result = await deleteReportScheduleAction("schedule-1");

    expect(result.success).toBe(true);
    expect(mockDeleteReportScheduleUseCase.execute).toHaveBeenCalledWith(
      "schedule-1",
    );
  });

  it("rejects deleting another user's schedule for non-admin schedule users", async () => {
    mockReportScheduleRepository.findById.mockResolvedValue(
      buildSchedule({ createdById: "person-owner" }),
    );
    mockPersonRepository.findByUserId.mockResolvedValue({ id: "person-other" });

    const result = await deleteReportScheduleAction("schedule-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "You do not have permission to modify this schedule",
      );
    }
    expect(mockDeleteReportScheduleUseCase.execute).not.toHaveBeenCalled();
  });

  it("allows manage users to trigger schedules even without reports:schedule", async () => {
    mockHasPermission.mockResolvedValue(true);
    mockReportScheduleRepository.findById.mockResolvedValue(
      buildSchedule({ createdById: "person-owner" }),
    );
    mockExecuteScheduledReportUseCase.execute.mockResolvedValue(undefined);

    const result = await triggerReportScheduleAction("schedule-1");

    expect(result.success).toBe(true);
    expect(mockExecuteScheduledReportUseCase.execute).toHaveBeenCalledWith(
      "schedule-1",
    );
    expect(mockPersonRepository.findByUserId).not.toHaveBeenCalled();
  });
});
