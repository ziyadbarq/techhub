import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  BackupProgressEvent,
  CreateBackupOptions,
  IDatabaseBackupService,
  RestoreBackupOptions,
} from "@/core/services/database-backup.service.interface";
import {
  BackupStage,
  BackupStatus,
} from "@/core/domain/entities/database-backup.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class DatabaseBackupService implements IDatabaseBackupService {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  getBackupDirectory(): string {
    return (
      process.env.BACKUP_STORAGE_PATH ||
      path.resolve(process.cwd(), "local", "backups")
    );
  }

  async ensureBackupDirectory(): Promise<string> {
    const dir = this.getBackupDirectory();
    await fs.mkdir(dir, { recursive: true });
    await fs.access(dir, fsConstants.W_OK | fsConstants.R_OK);
    return dir;
  }

  async createBackupFile(options: CreateBackupOptions): Promise<{
    filePath: string;
    fileSize: number;
    durationSeconds: number;
    tableCount?: number;
    recordCount?: number;
  }> {
    const timer = this.logger.startTimer("createBackupFile", {
      backupId: options.backupId,
    });
    const backupDir = await this.ensureBackupDirectory();
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }

    const pgDumpPath = process.env.PG_DUMP_PATH || "pg_dump";
    const filePath = path.join(backupDir, options.filename);

    await this.emitProgress(options.onProgress, {
      backupId: options.backupId,
      status: BackupStatus.RUNNING,
      stage: BackupStage.INITIALIZING,
      percentage: 5,
      currentStep: "Preparing backup directory",
    });

    const start = performance.now();
    await this.runCommand(
      pgDumpPath,
      ["--file", filePath, "--format=plain", `--dbname=${databaseUrl}`],
      options.backupId,
      options.onProgress,
    );

    const fileStats = await fs.stat(filePath);
    const durationSeconds = Math.max(
      1,
      Math.round((performance.now() - start) / 1000),
    );

    await this.emitProgress(options.onProgress, {
      backupId: options.backupId,
      status: BackupStatus.RUNNING,
      stage: BackupStage.FINALIZING,
      percentage: 95,
      currentStep: "Finalizing backup file",
    });

    const metadata = await this.fetchMetadata();

    await this.emitProgress(options.onProgress, {
      backupId: options.backupId,
      status: BackupStatus.COMPLETED,
      stage: BackupStage.FINALIZING,
      percentage: 100,
      currentStep: "Backup completed successfully",
    });

    this.logger.endTimer(timer, {
      filePath,
      fileSize: fileStats.size,
      durationSeconds,
    });

    return {
      filePath,
      fileSize: fileStats.size,
      durationSeconds,
      tableCount: metadata.tableCount,
      recordCount: metadata.recordCount,
    };
  }

  async restoreFromBackup(options: RestoreBackupOptions): Promise<void> {
    const timer = this.logger.startTimer("restoreFromBackup", {
      backupId: options.backupId,
    });
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }

    await fs.access(options.filePath, fsConstants.R_OK);

    await this.emitProgress(options.onProgress, {
      backupId: options.backupId,
      status: BackupStatus.RUNNING,
      stage: BackupStage.INITIALIZING,
      percentage: 5,
      currentStep: "Preparing restore operation",
    });

    const psqlPath = process.env.PSQL_PATH || "psql";
    await this.runCommand(
      psqlPath,
      [
        `--dbname=${databaseUrl}`,
        "-c",
        "DROP SCHEMA public CASCADE; CREATE SCHEMA public;",
      ],
      options.backupId,
      options.onProgress,
      "Dropping existing schema",
    );

    await this.runCommand(
      psqlPath,
      [`--dbname=${databaseUrl}`, "-f", options.filePath],
      options.backupId,
      options.onProgress,
      "Restoring from backup file",
    );

    await this.emitProgress(options.onProgress, {
      backupId: options.backupId,
      status: BackupStatus.COMPLETED,
      stage: BackupStage.FINALIZING,
      percentage: 100,
      currentStep: "Database restored successfully",
    });

    this.logger.endTimer(timer, { backupId: options.backupId });
  }

  private async runCommand(
    command: string,
    args: string[],
    backupId: string,
    onProgress?: (progress: BackupProgressEvent) => Promise<void> | void,
    currentStep?: string,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });

      child.stdout.on("data", (chunk: Buffer) => {
        this.logger.debug(chunk.toString(), { command, backupId });
      });

      child.stderr.on("data", (chunk: Buffer) => {
        this.logger.warn(chunk.toString(), { command, backupId });
      });

      child.on("error", (error) => {
        this.emitProgress(onProgress, {
          backupId,
          status: BackupStatus.FAILED,
          currentStep,
          errorMessage: error.message,
          errorCode: "command_error",
        }).finally(() => {
          reject(error);
        });
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          const error = new Error(
            `${command} exited with code ${code ?? "unknown"}`,
          );
          this.emitProgress(onProgress, {
            backupId,
            status: BackupStatus.FAILED,
            currentStep,
            errorMessage: error.message,
            errorCode: "command_failed",
          }).finally(() => reject(error));
        }
      });

      if (currentStep) {
        this.emitProgress(onProgress, {
          backupId,
          status: BackupStatus.RUNNING,
          stage: BackupStage.DUMPING,
          percentage: 50,
          currentStep,
        }).catch(() => {
          // ignore progress errors
        });
      }
    });
  }

  private async emitProgress(
    onProgress: CreateBackupOptions["onProgress"],
    progress: BackupProgressEvent,
  ): Promise<void> {
    if (onProgress) {
      await onProgress(progress);
    }
  }

  private async fetchMetadata(): Promise<{
    tableCount?: number;
    recordCount?: number;
  }> {
    try {
      const tables = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;
      const tableCount = Number(tables[0]?.count ?? 0);

      const records = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT SUM(reltuples)::bigint AS count
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relkind = 'r'
      `;
      const recordCountValue = records[0]?.count;

      return {
        tableCount,
        recordCount:
          recordCountValue === undefined || recordCountValue === null
            ? undefined
            : Number(recordCountValue),
      };
    } catch (error) {
      this.logger.warn("Failed to collect backup metadata", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }
}
