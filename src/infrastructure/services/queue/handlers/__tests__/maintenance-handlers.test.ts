import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleDataExport } from "../data-export.handler";
import { handleDatabaseCleanup } from "../database-cleanup.handler";
import { handleHealthCheck } from "../health-check.handler";
import { DI_TOKENS } from "@/di/types";
import type {
  DataExportJobData,
  DatabaseCleanupJobData,
  HealthCheckJobData,
} from "@/core/domain/jobs/job-data.types";

const { mockMkdir, mockWriteFile } = vi.hoisted(() => ({
  mockMkdir: vi.fn(),
  mockWriteFile: vi.fn(),
}));

const mockTaskRepository = {
  findAll: vi.fn(),
  deleteOldCompleted: vi.fn(),
};

const mockJobQueueService = {
  isHealthy: vi.fn(),
};

const mockPrisma = {
  $queryRaw: vi.fn(),
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const mockServices = new Map<symbol, unknown>([
  [DI_TOKENS.ITaskRepository, mockTaskRepository],
  [DI_TOKENS.IJobQueueService, mockJobQueueService],
  [DI_TOKENS.PrismaClient, mockPrisma],
  [DI_TOKENS.ILoggerService, mockLogger],
]);

vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: (token: symbol) => mockServices.get(token) ?? null,
  })),
}));

vi.mock("fs/promises", () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
}));

describe("maintenance queue handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTaskRepository.findAll.mockResolvedValue([]);
    mockTaskRepository.deleteOldCompleted.mockResolvedValue(0);
    mockJobQueueService.isHealthy.mockResolvedValue(true);
    mockPrisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it("throws for unsupported data export types", async () => {
    const job = {
      id: "job-export",
      data: {
        exportType: "custom",
        format: "json",
        userId: "user-1",
        email: "user@example.com",
      } as unknown as DataExportJobData,
      updateProgress: vi.fn(),
    };

    await expect(handleDataExport(job as never)).rejects.toThrow(
      'Export type "custom" is not yet supported. Supported types: tasks',
    );

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("returns health results only for requested checks", async () => {
    const job = {
      id: "job-health",
      data: {
        checks: ["database"],
        notifyOnFailure: true,
      } satisfies HealthCheckJobData,
      updateProgress: vi.fn(),
    };

    const result = await handleHealthCheck(job as never);

    expect(result).toMatchObject({
      allHealthy: true,
      database: true,
    });
    expect(result).not.toHaveProperty("redis");
    expect(mockJobQueueService.isHealthy).not.toHaveBeenCalled();
  });

  it("throws for unsupported health check types", async () => {
    const job = {
      id: "job-health-invalid",
      data: {
        checks: ["api"],
        notifyOnFailure: true,
      } as unknown as HealthCheckJobData,
      updateProgress: vi.fn(),
    };

    await expect(handleHealthCheck(job as never)).rejects.toThrow(
      "Unsupported health check types: api. Supported: database, redis",
    );

    expect(job.updateProgress).not.toHaveBeenCalled();
  });

  it("throws for unsupported database cleanup tables", async () => {
    const job = {
      id: "job-cleanup-invalid",
      data: {
        olderThanDays: 30,
        tables: ["audit_logs"],
      } as unknown as DatabaseCleanupJobData,
      updateProgress: vi.fn(),
    };

    await expect(handleDatabaseCleanup(job as never)).rejects.toThrow(
      "Unsupported database cleanup tables: audit_logs. Supported: tasks",
    );

    expect(mockTaskRepository.deleteOldCompleted).not.toHaveBeenCalled();
  });

  it("defaults database cleanup to tasks when no tables are provided", async () => {
    mockTaskRepository.deleteOldCompleted.mockResolvedValueOnce(2);

    const job = {
      id: "job-cleanup",
      data: {
        olderThanDays: 30,
      } satisfies DatabaseCleanupJobData,
      updateProgress: vi.fn(),
    };

    const result = await handleDatabaseCleanup(job as never);

    expect(result).toEqual({
      deletedCount: 2,
      processedBatches: 1,
    });
    expect(mockTaskRepository.deleteOldCompleted).toHaveBeenCalledTimes(1);
    expect(job.updateProgress).toHaveBeenLastCalledWith(100);
  });

  it("caps task exports without loading the full table into the output", async () => {
    const tasks = Array.from({ length: 50_001 }, (_, index) => ({
      id: `task-${index}`,
      title: `Task ${index}`,
      description: null,
      status: "PENDING",
      createdBy: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    }));
    mockTaskRepository.findAll.mockResolvedValue(tasks);

    const job = {
      id: "job-export-capped",
      data: {
        exportType: "tasks",
        format: "json",
        userId: "user-1",
        email: "user@example.com",
      } satisfies DataExportJobData,
      updateProgress: vi.fn(),
    };

    const result = await handleDataExport(job as never);

    expect(mockTaskRepository.findAll).toHaveBeenCalledWith({ limit: 50_001 });
    expect(result.rowCount).toBe(50_000);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "Export row limit reached, output was truncated",
      expect.objectContaining({
        jobId: "job-export-capped",
        exportType: "tasks",
        maxRows: 50_000,
        fetchedRows: 50_001,
        exportedRows: 50_000,
      }),
    );
  });
});
