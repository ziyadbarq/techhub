import { spawn } from "node:child_process";
import crypto from "node:crypto";
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
    checksum?: string;
    dbSchemaVersion?: string | null;
    codeSchemaVersion?: string | null;
    schemaDrift?: boolean;
    verificationStatus?: string;
    verificationError?: string | null;
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
    const extraDumpFlags =
      process.env.PG_DUMP_FLAGS?.split(/\s+/).filter(Boolean) ?? [];

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
      [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "--format=plain",
        "--file",
        filePath,
        `--dbname=${databaseUrl}`,
        ...extraDumpFlags,
      ],
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
    const checksum = await this.computeChecksum(filePath);
    const { dbSchemaVersion, codeSchemaVersion, schemaDrift } =
      await this.getSchemaVersions();
    const verificationResult = await this.verifyBackupFile(
      filePath,
      options.backupId,
      options.onProgress,
    );

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
      checksum,
      dbSchemaVersion,
      codeSchemaVersion,
      schemaDrift,
      verificationStatus: verificationResult.status,
      verificationError: verificationResult.error,
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
    const extraPsqlFlags =
      process.env.PSQL_FLAGS?.split(/\s+/).filter(Boolean) ?? [];
    await this.runCommand(
      psqlPath,
      [
        `--dbname=${databaseUrl}`,
        "--set",
        "ON_ERROR_STOP=1",
        "-c",
        "DROP SCHEMA public CASCADE; CREATE SCHEMA public;",
        ...extraPsqlFlags,
      ],
      options.backupId,
      options.onProgress,
      "Dropping existing schema",
    );

    await this.runCommand(
      psqlPath,
      [
        `--dbname=${databaseUrl}`,
        "--set",
        "ON_ERROR_STOP=1",
        "--single-transaction",
        "-f",
        options.filePath,
        ...extraPsqlFlags,
      ],
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

  private async computeChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash("sha256");
    const fileHandle = await fs.open(filePath, "r");
    const stream = fileHandle.createReadStream();
    return new Promise<string>((resolve, reject) => {
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", async () => {
        await fileHandle.close();
        resolve(hash.digest("hex"));
      });
      stream.on("error", async (err) => {
        await fileHandle.close();
        reject(err);
      });
    });
  }

  private async getSchemaVersions(): Promise<{
    dbSchemaVersion: string | null;
    codeSchemaVersion: string | null;
    schemaDrift: boolean;
  }> {
    let dbSchemaVersion: string | null = null;
    let codeSchemaVersion: string | null = null;

    try {
      const result = await this.prisma.$queryRaw<
        Array<{ migration_name: string | null }>
      >`SELECT migration_name FROM "_prisma_migrations" ORDER BY finished_at DESC NULLS LAST LIMIT 1`;
      dbSchemaVersion = result[0]?.migration_name ?? null;
    } catch (error) {
      this.logger.warn("Unable to read DB schema version", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const migrationsDir = path.resolve(
        process.cwd(),
        "src/infrastructure/database/prisma/schema/migrations",
      );
      const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
      const folders = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .reverse();
      codeSchemaVersion = folders[0] ?? null;
    } catch (error) {
      this.logger.warn("Unable to read code schema version", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const schemaDrift =
      Boolean(dbSchemaVersion) &&
      Boolean(codeSchemaVersion) &&
      dbSchemaVersion !== codeSchemaVersion;

    return { dbSchemaVersion, codeSchemaVersion, schemaDrift };
  }

  private async verifyBackupFile(
    filePath: string,
    backupId: string,
    onProgress?: (progress: BackupProgressEvent) => Promise<void> | void,
  ): Promise<{ status: string; error: string | null }> {
    const shouldVerify =
      (process.env.BACKUP_VERIFY_TEMP_DB ?? "").toLowerCase() === "true";
    if (!shouldVerify) {
      return { status: "skipped", error: null };
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return { status: "failed", error: "DATABASE_URL not configured" };
    }

    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = "/postgres";
    const tempDbName = `backup_verify_${crypto.randomUUID().replace(/-/g, "")}`;
    const psqlPath = process.env.PSQL_PATH || "psql";
    const extraPsqlFlags =
      process.env.PSQL_FLAGS?.split(/\s+/).filter(Boolean) ?? [];

    const progress = async (currentStep: string, percentage: number) => {
      await this.emitProgress(onProgress, {
        backupId,
        status: BackupStatus.RUNNING,
        stage: BackupStage.FINALIZING,
        percentage,
        currentStep,
      });
    };

    try {
      await progress("Verifying backup (creating temp db)", 96);
      await this.runCommand(
        psqlPath,
        [
          `--dbname=${adminUrl.toString()}`,
          "--set",
          "ON_ERROR_STOP=1",
          "-c",
          `CREATE DATABASE ${tempDbName};`,
          ...extraPsqlFlags,
        ],
        backupId,
        onProgress,
        "Creating verification database",
      );

      await progress("Verifying backup (replay into temp db)", 97);
      await this.runCommand(
        psqlPath,
        [
          `--dbname=${adminUrl
            .toString()
            .replace(/\/[^/]+$/, `/${tempDbName}`)}`,
          "--set",
          "ON_ERROR_STOP=1",
          "--single-transaction",
          "-f",
          filePath,
          ...extraPsqlFlags,
        ],
        backupId,
        onProgress,
        "Replaying backup into temp db",
      );

      await progress("Cleaning up verification db", 99);
      await this.runCommand(
        psqlPath,
        [
          `--dbname=${adminUrl.toString()}`,
          "--set",
          "ON_ERROR_STOP=1",
          "-c",
          `DROP DATABASE IF EXISTS ${tempDbName};`,
          ...extraPsqlFlags,
        ],
        backupId,
        onProgress,
        "Dropping verification database",
      );

      return { status: "passed", error: null };
    } catch (error) {
      try {
        await this.runCommand(
          psqlPath,
          [
            `--dbname=${adminUrl.toString()}`,
            "--set",
            "ON_ERROR_STOP=1",
            "-c",
            `DROP DATABASE IF EXISTS ${tempDbName};`,
            ...extraPsqlFlags,
          ],
          backupId,
          undefined,
        );
      } catch (_cleanupError) {
        // ignore cleanup failures
      }

      const message =
        error instanceof Error ? error.message : "Backup verification failed";
      this.logger.warn("Backup verification failed", {
        backupId,
        error: message,
      });
      return { status: "failed", error: message };
    }
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
