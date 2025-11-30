import type { Job } from "bullmq";
import Redis from "ioredis";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import {
  BackupStage,
  BackupStatus,
} from "@/core/domain/entities/database-backup.entity";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import type { IDatabaseBackupService } from "@/core/services/database-backup.service.interface";
import type { ILoggerService } from "@/core/services";
import type {
  DatabaseBackupJobData,
  DatabaseRestoreJobData,
} from "@/core/domain/jobs/job-data.types";
import type { BackupProgressEvent } from "@/core/services/database-backup.service.interface";

function createRedisPublisher(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  return new Redis(redisUrl, { lazyConnect: true });
}

async function publishProgress(
  repository: IDatabaseBackupRepository,
  logger: ILoggerService,
  backupId: string,
  progress: BackupProgressEvent,
  job: Job,
  redis?: Redis | null,
): Promise<void> {
  await repository.updateProgress(backupId, {
    status: progress.status,
    stage: progress.stage,
    percentage: progress.percentage,
    currentStep: progress.currentStep,
    errorMessage: progress.errorMessage,
    errorCode: progress.errorCode,
  });

  if (progress.percentage !== undefined) {
    await job.updateProgress(progress.percentage);
  }

  if (redis) {
    try {
      if (!redis.status || redis.status === "end") {
        await redis.connect();
      }
      await redis.publish(
        `backup:progress:${backupId}`,
        JSON.stringify({ ...progress, backupId }),
      );
    } catch (error) {
      logger.warn("Failed to publish backup progress to Redis", {
        backupId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export async function handleDatabaseBackup(
  job: Job<DatabaseBackupJobData>,
): Promise<void> {
  const container = getContainer();
  const repository = container.get<IDatabaseBackupRepository>(
    DI_TOKENS.IDatabaseBackupRepository,
  );
  const backupService = container.get<IDatabaseBackupService>(
    DI_TOKENS.IDatabaseBackupService,
  );
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  const redis = createRedisPublisher();
  const backupId = job.data.backupId;

  const backup = await repository.findById(backupId);
  if (!backup) {
    throw new Error(`Backup ${backupId} not found`);
  }

  const progressHandler = (progress: BackupProgressEvent) =>
    publishProgress(repository, logger, backupId, progress, job, redis);

  try {
    await progressHandler({
      backupId,
      status: BackupStatus.RUNNING,
      stage: BackupStage.DUMPING,
      percentage: 10,
      currentStep: "Starting pg_dump",
    });

    const result = await backupService.createBackupFile({
      backupId,
      filename: job.data.filename,
      notes: job.data.notes,
      onProgress: progressHandler,
    });

    await repository.update(backupId, {
      status: BackupStatus.COMPLETED,
      stage: BackupStage.FINALIZING,
      percentage: 100,
      completedAt: new Date(),
      durationSeconds: result.durationSeconds,
      fileSize: result.fileSize,
      tableCount: result.tableCount,
      recordCount: result.recordCount,
      currentStep: "Backup completed successfully",
    });

    await job.updateProgress(100);
  } catch (error) {
    await repository.updateProgress(backupId, {
      status: BackupStatus.FAILED,
      stage: BackupStage.FINALIZING,
      percentage: 100,
      currentStep: "Backup failed",
      errorMessage: error instanceof Error ? error.message : "Backup failed",
    });

    logger.error(
      "Backup job failed",
      error instanceof Error ? error : new Error(String(error)),
      { backupId },
    );
    throw error;
  } finally {
    if (redis) {
      await redis.quit();
    }
  }
}

export async function handleDatabaseRestore(
  job: Job<DatabaseRestoreJobData>,
): Promise<void> {
  const container = getContainer();
  const repository = container.get<IDatabaseBackupRepository>(
    DI_TOKENS.IDatabaseBackupRepository,
  );
  const backupService = container.get<IDatabaseBackupService>(
    DI_TOKENS.IDatabaseBackupService,
  );
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
  const redis = createRedisPublisher();

  const backup = await repository.findById(job.data.backupId);
  if (!backup) {
    throw new Error(`Backup ${job.data.backupId} not found`);
  }

  const progressHandler = (progress: BackupProgressEvent) =>
    publishProgress(
      repository,
      logger,
      job.data.backupId,
      progress,
      job,
      redis,
    );

  try {
    await progressHandler({
      backupId: job.data.backupId,
      status: BackupStatus.RUNNING,
      stage: BackupStage.INITIALIZING,
      percentage: 10,
      currentStep: "Preparing database restore",
    });

    await backupService.restoreFromBackup({
      backupId: job.data.backupId,
      filePath: job.data.filePath,
      onProgress: progressHandler,
    });

    await repository.updateProgress(job.data.backupId, {
      status: BackupStatus.COMPLETED,
      stage: BackupStage.FINALIZING,
      percentage: 100,
      currentStep: "Database restored successfully",
      completedAt: new Date(),
    });

    await job.updateProgress(100);
  } catch (error) {
    await repository.updateProgress(job.data.backupId, {
      status: BackupStatus.FAILED,
      stage: BackupStage.FINALIZING,
      percentage: 100,
      currentStep: "Restore failed",
      errorMessage: error instanceof Error ? error.message : "Restore failed",
    });

    logger.error(
      "Restore job failed",
      error instanceof Error ? error : new Error(String(error)),
      { backupId: job.data.backupId },
    );
    throw error;
  } finally {
    if (redis) {
      await redis.quit();
    }
  }
}
