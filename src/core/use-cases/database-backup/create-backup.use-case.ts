import path from "node:path";
import { ConflictError } from "@/core/domain/errors/conflict.error";
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
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

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

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(input: CreateDatabaseBackupInput): Promise<DatabaseBackup> {
    const activeBackups = await this.repository.findMany({
      statuses: [BackupStatus.RUNNING, BackupStatus.PENDING],
      limit: 1,
    });
    if (activeBackups.length > 0) {
      throw new ConflictError(
        "Another backup is already running or queued. Please wait.",
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      // Missing DATABASE_URL is a deployment misconfiguration, not a business
      // rejection — it must surface at error severity in monitoring.
      // eslint-disable-next-line no-restricted-syntax
      throw new Error("DATABASE_URL is not configured");
    }

    const hasWorkers = await this.jobQueue.hasActiveWorkers(
      QUEUE_NAMES.MAINTENANCE,
    );

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

    if (hasWorkers) {
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
    } else {
      this.logger.warn(
        "Maintenance worker not detected, running backup inline (synchronous)",
        { backupId: backupData.id },
      );

      const progressHandler = async (
        progress: Partial<{
          status: BackupStatus;
          stage: BackupStage | null;
          percentage: number;
          currentStep?: string | null;
          errorMessage?: string | null;
        }>,
      ) => {
        await this.repository.updateProgress(backupData.id, {
          status: progress.status,
          stage: progress.stage ?? undefined,
          percentage: progress.percentage,
          currentStep: progress.currentStep,
          errorMessage: progress.errorMessage,
        });
      };

      await this.repository.updateProgress(backupData.id, {
        status: BackupStatus.RUNNING,
        stage: BackupStage.DUMPING,
        percentage: 10,
        currentStep: "Running backup inline (no worker detected)",
      });

      try {
        const result = await this.backupService.createBackupFile({
          backupId: backupData.id,
          filename,
          notes: input.notes ?? null,
          onProgress: (progress) =>
            progressHandler({
              status: progress.status,
              stage: progress.stage ?? undefined,
              percentage: progress.percentage,
              currentStep: progress.currentStep ?? undefined,
              errorMessage: progress.errorMessage ?? undefined,
            }),
        });

        await this.repository.update(backupData.id, {
          status: BackupStatus.COMPLETED,
          stage: BackupStage.FINALIZING,
          percentage: 100,
          completedAt: new Date(),
          durationSeconds: result.durationSeconds,
          fileSize: result.fileSize,
          tableCount: result.tableCount,
          recordCount: result.recordCount,
          checksum: result.checksum ?? null,
          dbSchemaVersion: result.dbSchemaVersion ?? null,
          codeSchemaVersion: result.codeSchemaVersion ?? null,
          schemaDrift: result.schemaDrift ?? false,
          verificationStatus: result.verificationStatus ?? null,
          verificationError: result.verificationError ?? null,
          currentStep: "Backup completed inline",
        });
      } catch (error) {
        await this.repository.updateProgress(backupData.id, {
          status: BackupStatus.FAILED,
          stage: BackupStage.FINALIZING,
          percentage: 100,
          currentStep: "Backup failed inline",
          errorMessage:
            error instanceof Error ? error.message : "Backup failed inline",
        });
        throw error;
      }
    }

    const latest = await this.repository.findById(backupData.id);
    return latest ?? backup;
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
