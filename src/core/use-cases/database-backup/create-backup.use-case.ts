import path from "node:path";
import { format } from "date-fns";
import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import {
  BackupStage,
  BackupStatus,
  type DatabaseBackup,
} from "@/core/domain/entities/database-backup.entity";
import { MAINTENANCE_JOBS, QUEUE_NAMES } from "@/core/domain/jobs/job-names";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { DatabaseBackupJobData } from "@/core/domain/jobs/job-data.types";
import type { IDatabaseBackupService } from "@/core/services/database-backup.service.interface";

export interface CreateDatabaseBackupInput {
  userId: string;
  notes?: string | null;
}

@injectable()
export class CreateDatabaseBackupUseCase {
  constructor(
    @inject(DI_TOKENS.IDatabaseBackupRepository)
    private readonly repository: IDatabaseBackupRepository,
    @inject(DI_TOKENS.IJobQueueService)
    private readonly jobQueue: IJobQueueService,
    @inject(DI_TOKENS.IDatabaseBackupService)
    private readonly backupService: IDatabaseBackupService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: CreateDatabaseBackupInput): Promise<DatabaseBackup> {
    const activeBackups = await this.repository.findMany({
      statuses: [BackupStatus.RUNNING, BackupStatus.PENDING],
      limit: 1,
    });
    if (activeBackups.length > 0) {
      throw new Error(
        "Another backup is already running or queued. Please wait.",
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }

    const hasWorkers = await this.jobQueue.hasActiveWorkers(
      QUEUE_NAMES.MAINTENANCE,
    );
    if (!hasWorkers) {
      throw new Error(
        "Backup worker is not running. Start the maintenance worker before triggering a backup.",
      );
    }

    const filename = this.buildFilename();
    const backupDir = await this.backupService.ensureBackupDirectory();
    const filePath = path.join(backupDir, filename);
    const databaseName = this.extractDatabaseName(databaseUrl);
    const postgresVersion = process.env.POSTGRES_VERSION || "unknown";

    const backup = await this.repository.create({
      filename,
      filePath,
      fileSize: 0,
      status: BackupStatus.PENDING,
      stage: BackupStage.INITIALIZING,
      percentage: 0,
      currentStep: "Queued",
      createdById: input.userId,
      notes: input.notes ?? null,
      databaseName,
      postgresVersion,
      startedAt: new Date(),
    });

    const backupData = backup.toJSON();

    try {
      await this.jobQueue.addJob<DatabaseBackupJobData>(
        QUEUE_NAMES.MAINTENANCE,
        MAINTENANCE_JOBS.DATABASE_BACKUP,
        {
          backupId: backupData.id,
          filename,
          userId: input.userId,
          notes: input.notes ?? null,
        },
        {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    } catch (error) {
      await this.repository.updateProgress(backupData.id, {
        status: BackupStatus.FAILED,
        stage: BackupStage.FINALIZING,
        percentage: 100,
        currentStep: "Failed to enqueue backup job",
        errorMessage:
          error instanceof Error ? error.message : "Failed to enqueue backup",
        completedAt: new Date(),
      });
      throw error;
    }

    this.logger.info("Database backup job queued", {
      backupId: backupData.id,
      filename,
    });

    return backup;
  }

  private buildFilename(): string {
    const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
    return `backup_${timestamp}.sql`;
  }

  private extractDatabaseName(databaseUrl: string): string {
    try {
      const url = new URL(databaseUrl);
      return url.pathname.replace("/", "") || "unknown";
    } catch (_error) {
      return "unknown";
    }
  }
}
