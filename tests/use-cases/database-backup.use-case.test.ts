import fs from "node:fs/promises";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Container } from "inversify";
import { format } from "date-fns";
import { DI_TOKENS } from "@/di/types";
import {
  BackupStage,
  BackupStatus,
  DatabaseBackup,
} from "@/core/domain/entities/database-backup.entity";
import type {
  BackupProgressUpdate,
  IDatabaseBackupRepository,
  UpdateDatabaseBackupData,
} from "@/core/repositories/database-backup.repository.interface";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { JobType } from "bullmq";
import type { IDatabaseBackupService } from "@/core/services/database-backup.service.interface";
import type { ILoggerService } from "@/core/services";
import { MAINTENANCE_JOBS, QUEUE_NAMES } from "@/core/domain/jobs/job-names";
import { CreateDatabaseBackupUseCase } from "@/core/use-cases/database-backup/create-backup.use-case";
import { RestoreDatabaseFromBackupUseCase } from "@/core/use-cases/database-backup/restore-from-backup.use-case";
import { DeleteDatabaseBackupUseCase } from "@/core/use-cases/database-backup/delete-backup.use-case";
import { ListDatabaseBackupsUseCase } from "@/core/use-cases/database-backup/list-backups.use-case";

const mockLogger: ILoggerService = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  child: () => mockLogger,
  startTimer: (operation: string, context?: Record<string, unknown>) => ({
    startTime: Date.now(),
    operation,
    context,
  }),
  endTimer: () => {},
  audit: () => {},
  withTiming: async <T>(_operation: string, fn: () => Promise<T>): Promise<T> =>
    fn(),
};

function buildBackup(
  overrides: Partial<ReturnType<DatabaseBackup["toJSON"]>> = {},
): DatabaseBackup {
  const now = new Date();
  return new DatabaseBackup({
    id: overrides.id ?? "backup-id",
    filename: overrides.filename ?? "backup_20240101_000000.sql",
    filePath: overrides.filePath ?? "/tmp/backups/backup_20240101_000000.sql",
    fileSize: overrides.fileSize ?? 0,
    status: overrides.status ?? BackupStatus.PENDING,
    stage: overrides.stage ?? BackupStage.INITIALIZING,
    percentage: overrides.percentage ?? 0,
    currentStep: overrides.currentStep ?? null,
    createdById: overrides.createdById ?? "user-1",
    notes: overrides.notes ?? null,
    databaseName: overrides.databaseName ?? "barq_assets",
    postgresVersion: overrides.postgresVersion ?? "15",
    tableCount: overrides.tableCount ?? null,
    recordCount: overrides.recordCount ?? null,
    startedAt: overrides.startedAt ?? now,
    completedAt: overrides.completedAt ?? null,
    durationSeconds: overrides.durationSeconds ?? null,
    errorMessage: overrides.errorMessage ?? null,
    errorCode: overrides.errorCode ?? null,
    errorDetails: overrides.errorDetails ?? null,
    deletedAt: overrides.deletedAt ?? null,
    deletedById: overrides.deletedById ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  });
}

class MockBackupRepository implements IDatabaseBackupRepository {
  private backups = new Map<string, DatabaseBackup>();
  public progressCalls: Array<{ id: string; data: unknown }> = [];
  private seq = 1;

  async create(data: Parameters<IDatabaseBackupRepository["create"]>[0]) {
    const id = `backup-${this.seq++}`;
    const backup = buildBackup({
      id,
      filename: data.filename,
      filePath: data.filePath,
      status: data.status ?? BackupStatus.PENDING,
      stage: data.stage ?? BackupStage.INITIALIZING,
      percentage: data.percentage ?? 0,
      currentStep: data.currentStep ?? null,
      createdById: data.createdById,
      notes: data.notes ?? null,
      databaseName: data.databaseName,
      postgresVersion: data.postgresVersion,
      startedAt: data.startedAt ?? new Date(),
    });
    this.backups.set(id, backup);
    return backup;
  }

  async findById(id: string) {
    return this.backups.get(id) ?? null;
  }

  async findMany() {
    return Array.from(this.backups.values());
  }

  async findRunning() {
    return (
      Array.from(this.backups.values()).find(
        (b) => b.toJSON().status === BackupStatus.RUNNING,
      ) ?? null
    );
  }

  async update(id: string, data: UpdateDatabaseBackupData) {
    const existing = this.backups.get(id);
    if (!existing) throw new Error("Not found");
    const merged = buildBackup({ ...existing.toJSON(), ...data });
    this.backups.set(id, merged);
    return merged;
  }

  async updateProgress(id: string, data: BackupProgressUpdate) {
    this.progressCalls.push({ id, data });
    const existing = this.backups.get(id);
    if (!existing) return;
    const merged = buildBackup({ ...existing.toJSON(), ...data });
    this.backups.set(id, merged);
  }

  async softDelete(id: string, deletedById: string) {
    const existing = this.backups.get(id);
    if (!existing) return;
    this.backups.set(
      id,
      buildBackup({
        ...existing.toJSON(),
        deletedAt: new Date(),
        deletedById,
      }),
    );
  }
}

class MockJobQueue implements IJobQueueService {
  public jobs: Array<{
    queue: string;
    name: string;
    data: unknown;
    options?: unknown;
  }> = [];
  private activeQueues = new Set<string>();

  async addJob(
    queueName: string,
    jobName: string,
    data: unknown,
    options?: unknown,
  ) {
    this.activeQueues.add(queueName);
    this.jobs.push({ queue: queueName, name: jobName, data, options });
    return `job-${this.jobs.length}`;
  }
  async scheduleJob() {
    throw new Error("Not implemented");
  }
  async removeJob() {
    throw new Error("Not implemented");
  }
  async removeRepeatableJob() {
    throw new Error("Not implemented");
  }
  async getJobStatus() {
    return null;
  }
  async getQueueMetrics() {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }
  async hasActiveWorkers(): Promise<boolean> {
    return true;
  }
  async isHealthy(): Promise<boolean> {
    return true;
  }
  getActiveQueues(): string[] {
    return Array.from(this.activeQueues);
  }
  async findJob(
    _queueName: string,
    jobName: string,
    _states: JobType[],
    predicate?: (data: unknown) => boolean,
  ) {
    const match = this.jobs.find(
      (job) => job.name === jobName && (!predicate || predicate(job.data)),
    );
    return match ? { id: "job-1", state: "waiting", data: match.data } : null;
  }
  async pauseQueue() {}
  async resumeQueue() {}
  async close() {
    this.activeQueues.clear();
  }
}

class MockBackupService implements IDatabaseBackupService {
  getBackupDirectory() {
    return "/tmp/backups";
  }
  async ensureBackupDirectory() {
    return "/tmp/backups";
  }
  async createBackupFile() {
    return {
      filePath: "/tmp/backups/backup.sql",
      fileSize: 1024,
      durationSeconds: 2,
      tableCount: 10,
      recordCount: 1000,
    };
  }
  async restoreFromBackup() {
    return;
  }
}

describe("Database Backup Use Cases", () => {
  let container: Container;
  let repository: MockBackupRepository;
  let jobQueue: MockJobQueue;
  let backupService: MockBackupService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    process.env.DATABASE_URL =
      "postgresql://user:password@localhost:5432/barq_assets_test";

    container = new Container();
    repository = new MockBackupRepository();
    jobQueue = new MockJobQueue();
    backupService = new MockBackupService();

    container
      .bind<IDatabaseBackupRepository>(DI_TOKENS.IDatabaseBackupRepository)
      .toConstantValue(repository);
    container
      .bind<IJobQueueService>(DI_TOKENS.IJobQueueService)
      .toConstantValue(jobQueue);
    container
      .bind<IDatabaseBackupService>(DI_TOKENS.IDatabaseBackupService)
      .toConstantValue(backupService);
    container
      .bind<ILoggerService>(DI_TOKENS.ILoggerService)
      .toConstantValue(mockLogger);

    container
      .bind<CreateDatabaseBackupUseCase>(DI_TOKENS.CreateDatabaseBackupUseCase)
      .to(CreateDatabaseBackupUseCase);
    container
      .bind<RestoreDatabaseFromBackupUseCase>(
        DI_TOKENS.RestoreDatabaseFromBackupUseCase,
      )
      .to(RestoreDatabaseFromBackupUseCase);
    container
      .bind<DeleteDatabaseBackupUseCase>(DI_TOKENS.DeleteDatabaseBackupUseCase)
      .to(DeleteDatabaseBackupUseCase);
    container
      .bind<ListDatabaseBackupsUseCase>(DI_TOKENS.ListDatabaseBackupsUseCase)
      .to(ListDatabaseBackupsUseCase);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("creates a backup and enqueues a job", async () => {
    const useCase = container.get<CreateDatabaseBackupUseCase>(
      DI_TOKENS.CreateDatabaseBackupUseCase,
    );

    const backup = await useCase.execute({ userId: "user-123", notes: "test" });

    expect(backup.toJSON().filename).toBe(
      `backup_${format(new Date(), "yyyyMMdd_HHmmss")}.sql`,
    );
    expect(jobQueue.jobs).toHaveLength(1);
    expect(jobQueue.jobs[0]).toMatchObject({
      queue: QUEUE_NAMES.MAINTENANCE,
      name: MAINTENANCE_JOBS.DATABASE_BACKUP,
    });
  });

  it("prevents concurrent backups", async () => {
    repository["backups"].set(
      "running",
      buildBackup({ id: "running", status: BackupStatus.RUNNING }),
    );
    const useCase = container.get<CreateDatabaseBackupUseCase>(
      DI_TOKENS.CreateDatabaseBackupUseCase,
    );

    await expect(useCase.execute({ userId: "user-123" })).rejects.toThrow(
      "Another backup is already running or queued. Please wait.",
    );
  });

  it("queues restore job and updates initial progress", async () => {
    const accessSpy = vi.spyOn(fs, "access").mockResolvedValueOnce();
    const backup = await repository.create({
      filename: "file.sql",
      filePath: "/tmp/file.sql",
      createdById: "u1",
      databaseName: "db",
      postgresVersion: "15",
      status: BackupStatus.COMPLETED,
    });
    const useCase = container.get<RestoreDatabaseFromBackupUseCase>(
      DI_TOKENS.RestoreDatabaseFromBackupUseCase,
    );

    await useCase.execute({ backupId: backup.toJSON().id, userId: "u1" });

    expect(accessSpy).toHaveBeenCalled();
    expect(repository.progressCalls.at(-1)?.data).toMatchObject({
      status: BackupStatus.RUNNING,
      stage: BackupStage.INITIALIZING,
    });
    expect(jobQueue.jobs.at(-1)).toMatchObject({
      queue: QUEUE_NAMES.MAINTENANCE,
      name: MAINTENANCE_JOBS.DATABASE_RESTORE,
    });
  });

  it("throws when restoring a missing backup", async () => {
    const useCase = container.get<RestoreDatabaseFromBackupUseCase>(
      DI_TOKENS.RestoreDatabaseFromBackupUseCase,
    );

    await expect(
      useCase.execute({ backupId: "missing", userId: "u1" }),
    ).rejects.toThrow("Backup not found");
  });

  it("throws when restoring a deleted backup", async () => {
    const backup = buildBackup({ deletedAt: new Date() });
    repository["backups"].set(backup.toJSON().id, backup);
    const useCase = container.get<RestoreDatabaseFromBackupUseCase>(
      DI_TOKENS.RestoreDatabaseFromBackupUseCase,
    );

    await expect(
      useCase.execute({ backupId: backup.toJSON().id, userId: "u1" }),
    ).rejects.toThrow("Cannot restore from a deleted backup");
  });

  it("soft deletes a completed backup", async () => {
    const backup = buildBackup({ status: BackupStatus.COMPLETED });
    repository["backups"].set(backup.toJSON().id, backup);
    const unlinkSpy = vi.spyOn(fs, "unlink").mockResolvedValueOnce();
    const useCase = container.get<DeleteDatabaseBackupUseCase>(
      DI_TOKENS.DeleteDatabaseBackupUseCase,
    );

    await useCase.execute({
      backupId: backup.toJSON().id,
      deletedById: "admin",
    });

    expect(unlinkSpy).toHaveBeenCalled();
    expect(
      repository["backups"].get(backup.toJSON().id)?.toJSON().deletedAt,
    ).toBeInstanceOf(Date);
  });

  it("throws when deleting a running backup", async () => {
    const backup = buildBackup({ status: BackupStatus.RUNNING });
    repository["backups"].set(backup.toJSON().id, backup);
    const useCase = container.get<DeleteDatabaseBackupUseCase>(
      DI_TOKENS.DeleteDatabaseBackupUseCase,
    );

    await expect(
      useCase.execute({ backupId: backup.toJSON().id, deletedById: "admin" }),
    ).rejects.toThrow("Cannot delete a backup while it is running");
  });

  it("lists backups via list use case", async () => {
    const backup = buildBackup({ id: "b1" });
    repository["backups"].set("b1", backup);
    const useCase = container.get<ListDatabaseBackupsUseCase>(
      DI_TOKENS.ListDatabaseBackupsUseCase,
    );

    const result = await useCase.execute();
    expect(result).toHaveLength(1);
    expect(result[0].toJSON().id).toBe("b1");
  });
});
