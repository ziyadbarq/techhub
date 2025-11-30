import fs from "node:fs/promises";
import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import {
  BackupStage,
  BackupStatus,
  type DatabaseBackup,
} from "@/core/domain/entities/database-backup.entity";
import { MAINTENANCE_JOBS, QUEUE_NAMES } from "@/core/domain/jobs/job-names";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import type { DatabaseRestoreJobData } from "@/core/domain/jobs/job-data.types";
import type { ILoggerService } from "@/core/services";

export interface RestoreDatabaseFromBackupInput {
  backupId: string;
  userId: string;
}

@injectable()
export class RestoreDatabaseFromBackupUseCase {
  constructor(
    @inject(DI_TOKENS.IDatabaseBackupRepository)
    private readonly repository: IDatabaseBackupRepository,
    @inject(DI_TOKENS.IJobQueueService)
    private readonly jobQueue: IJobQueueService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    input: RestoreDatabaseFromBackupInput,
  ): Promise<DatabaseBackup> {
    const backup = await this.repository.findById(input.backupId);
    if (!backup) {
      throw new Error("Backup not found");
    }

    const backupData = backup.toJSON();

    if (backupData.deletedAt) {
      throw new Error("Cannot restore from a deleted backup");
    }

    if (backupData.status !== BackupStatus.COMPLETED) {
      throw new Error(
        "Backup is not completed. Restore requires a completed backup.",
      );
    }

    try {
      await fs.access(backupData.filePath);
    } catch {
      throw new Error("Backup file is missing on disk");
    }

    const hasWorkers = await this.jobQueue.hasActiveWorkers(
      QUEUE_NAMES.MAINTENANCE,
    );
    if (!hasWorkers) {
      throw new Error(
        "Backup worker is not running. Start the maintenance worker before triggering a restore.",
      );
    }

    await this.repository.updateProgress(input.backupId, {
      status: BackupStatus.RUNNING,
      stage: BackupStage.INITIALIZING,
      percentage: 5,
      currentStep: "Queued for restore",
    });

    try {
      await this.jobQueue.addJob<DatabaseRestoreJobData>(
        QUEUE_NAMES.MAINTENANCE,
        MAINTENANCE_JOBS.DATABASE_RESTORE,
        {
          backupId: input.backupId,
          userId: input.userId,
          filePath: backupData.filePath,
        },
        {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    } catch (error) {
      await this.repository.updateProgress(input.backupId, {
        status: BackupStatus.FAILED,
        stage: BackupStage.FINALIZING,
        percentage: 100,
        currentStep: "Failed to enqueue restore job",
        errorMessage:
          error instanceof Error ? error.message : "Failed to enqueue restore",
        completedAt: new Date(),
      });
      throw error;
    }

    this.logger.info("Database restore job queued", {
      backupId: input.backupId,
    });

    return backup;
  }
}
