import { inject, injectable } from "inversify";
import type { JobType } from "bullmq";
import { DI_TOKENS } from "@/di/types";
import {
  BackupStage,
  BackupStatus,
  type DatabaseBackup,
} from "@/core/domain/entities/database-backup.entity";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";
import { MAINTENANCE_JOBS, QUEUE_NAMES } from "@/core/domain/jobs/job-names";
import type { ILoggerService } from "@/core/services";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CancelDatabaseBackupInput {
  backupId: string;
  cancelledById: string;
}

@injectable()
export class CancelDatabaseBackupUseCase {
  constructor(
    @inject(DI_TOKENS.IDatabaseBackupRepository)
    private readonly repository: IDatabaseBackupRepository,
    @inject(DI_TOKENS.IJobQueueService)
    private readonly jobQueue: IJobQueueService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: CancelDatabaseBackupInput): Promise<DatabaseBackup> {
    const backup = await this.repository.findById(input.backupId);
    if (!backup) {
      throw new NotFoundError("Backup not found");
    }

    const backupData = backup.toJSON();
    if (
      backupData.status !== BackupStatus.RUNNING &&
      backupData.status !== BackupStatus.PENDING
    ) {
      throw new Error("Only pending or running backups can be cancelled");
    }

    await this.cancelQueueJob(input.backupId);

    const completedAt = new Date();
    const startedAt = backupData.startedAt ?? completedAt;
    const durationSeconds = Math.max(
      0,
      Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000),
    );

    await this.repository.updateProgress(input.backupId, {
      status: BackupStatus.FAILED,
      stage: BackupStage.FINALIZING,
      percentage: 100,
      currentStep: "Cancelled by administrator",
      errorMessage: `Cancelled by user ${input.cancelledById}`,
      completedAt,
      durationSeconds,
    });

    const updated = await this.repository.findById(input.backupId);
    return updated ?? backup;
  }

  private async cancelQueueJob(backupId: string): Promise<void> {
    try {
      const cancellableStates: JobType[] = [
        "waiting",
        "active",
        "delayed",
        "paused",
      ];

      const job =
        (await this.jobQueue.findJob(
          QUEUE_NAMES.MAINTENANCE,
          MAINTENANCE_JOBS.DATABASE_BACKUP,
          cancellableStates,
          (data) => (data as { backupId?: string }).backupId === backupId,
        )) ??
        (await this.jobQueue.findJob(
          QUEUE_NAMES.MAINTENANCE,
          MAINTENANCE_JOBS.DATABASE_RESTORE,
          cancellableStates,
          (data) => (data as { backupId?: string }).backupId === backupId,
        ));

      if (job?.id) {
        await this.jobQueue.removeJob(QUEUE_NAMES.MAINTENANCE, job.id);
        this.logger.info("Cancelled backup job in queue", {
          backupId,
          jobId: job.id,
          state: job.state,
        });
      }
    } catch (error) {
      this.logger.warn("Failed to cancel queued backup job", {
        backupId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
