import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { DatabaseBackup as PrismaDatabaseBackup } from "@/generated/prisma";
import type { BackupStage as PrismaBackupStage } from "@/generated/prisma/enums";
import { BackupStatus as PrismaBackupStatus } from "@/generated/prisma/enums";
import { DI_TOKENS } from "@/di/types";
import type {
  BackupStage,
  BackupStatus,
} from "@/core/domain/entities/database-backup.entity";
import { DatabaseBackup } from "@/core/domain/entities/database-backup.entity";
import type {
  BackupProgressUpdate,
  CreateDatabaseBackupData,
  DatabaseBackupQuery,
  IDatabaseBackupRepository,
  UpdateDatabaseBackupData,
} from "@/core/repositories/database-backup.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaDatabaseBackupRepository
  implements IDatabaseBackupRepository
{
  private readonly logger = createRepositoryLogger("DatabaseBackupRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(data: CreateDatabaseBackupData): Promise<DatabaseBackup> {
    const created = await this.logger.logOperation("create", () =>
      this.prisma.databaseBackup.create({
        data: {
          filename: data.filename,
          filePath: data.filePath,
          fileSize: BigInt(data.fileSize ?? 0),
          status:
            (data.status as PrismaBackupStatus | undefined) ??
            PrismaBackupStatus.PENDING,
          stage: (data.stage as PrismaBackupStage | null | undefined) ?? null,
          percentage: data.percentage ?? 0,
          currentStep: data.currentStep ?? null,
          createdById: data.createdById,
          notes: data.notes ?? null,
          databaseName: data.databaseName,
          postgresVersion: data.postgresVersion,
          tableCount: data.tableCount ?? null,
          recordCount:
            data.recordCount === undefined || data.recordCount === null
              ? null
              : BigInt(data.recordCount),
          startedAt: data.startedAt ?? new Date(),
          completedAt: data.completedAt ?? null,
          durationSeconds: data.durationSeconds ?? null,
          errorMessage: data.errorMessage ?? null,
          errorCode: data.errorCode ?? null,
          errorDetails: data.errorDetails ?? null,
          checksum: data.checksum ?? null,
          dbSchemaVersion: data.dbSchemaVersion ?? null,
          codeSchemaVersion: data.codeSchemaVersion ?? null,
          schemaDrift: data.schemaDrift ?? false,
          verificationStatus: data.verificationStatus ?? null,
          verificationError: data.verificationError ?? null,
        },
      }),
    );

    return this.toDomain(created);
  }

  async findById(id: string): Promise<DatabaseBackup | null> {
    const backup = await this.logger.logOperation("findById", () =>
      this.prisma.databaseBackup.findUnique({
        where: { id },
      }),
    );

    return backup ? this.toDomain(backup) : null;
  }

  async findMany(query?: DatabaseBackupQuery): Promise<DatabaseBackup[]> {
    const backups = await this.logger.logOperation("findMany", () =>
      this.prisma.databaseBackup.findMany({
        where: {
          deletedAt: query?.includeDeleted ? undefined : null,
          status: query?.statuses
            ? { in: query.statuses as PrismaBackupStatus[] }
            : undefined,
        },
        take: query?.limit,
        orderBy: { createdAt: "desc" },
      }),
    );

    return backups.map((backup) => this.toDomain(backup));
  }

  async findRunning(): Promise<DatabaseBackup | null> {
    const backup = await this.logger.logOperation("findRunning", () =>
      this.prisma.databaseBackup.findFirst({
        where: {
          status: PrismaBackupStatus.RUNNING,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      }),
    );

    return backup ? this.toDomain(backup) : null;
  }

  async update(
    id: string,
    data: UpdateDatabaseBackupData,
  ): Promise<DatabaseBackup> {
    const updated = await this.logger.logOperation("update", () =>
      this.prisma.databaseBackup.update({
        where: { id },
        data: {
          ...this.toPrismaUpdate(data),
        },
      }),
    );

    return this.toDomain(updated);
  }

  async updateProgress(id: string, data: BackupProgressUpdate): Promise<void> {
    await this.logger.logOperation("updateProgress", () =>
      this.prisma.databaseBackup.update({
        where: { id },
        data: {
          status: data.status as PrismaBackupStatus | undefined,
          stage: data.stage as PrismaBackupStage | null | undefined,
          percentage: data.percentage,
          currentStep: data.currentStep,
          errorMessage: data.errorMessage,
          errorCode: data.errorCode,
          errorDetails: data.errorDetails,
          completedAt: data.completedAt,
          durationSeconds: data.durationSeconds,
          fileSize:
            data.fileSize !== undefined ? BigInt(data.fileSize) : undefined,
          tableCount: data.tableCount,
          recordCount:
            data.recordCount !== undefined && data.recordCount !== null
              ? BigInt(data.recordCount)
              : undefined,
          checksum: data.checksum,
          dbSchemaVersion: data.dbSchemaVersion,
          codeSchemaVersion: data.codeSchemaVersion,
          schemaDrift: data.schemaDrift,
          verificationStatus: data.verificationStatus,
          verificationError: data.verificationError,
        },
      }),
    );
  }

  async softDelete(id: string, deletedById: string): Promise<void> {
    await this.logger.logOperation("softDelete", () =>
      this.prisma.databaseBackup.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById,
        },
      }),
    );
  }

  private toDomain(backup: PrismaDatabaseBackup): DatabaseBackup {
    return new DatabaseBackup({
      id: backup.id,
      filename: backup.filename,
      filePath: backup.filePath,
      fileSize: Number(backup.fileSize),
      status: backup.status as BackupStatus,
      stage: backup.stage as BackupStage | null,
      percentage: backup.percentage,
      currentStep: backup.currentStep,
      createdById: backup.createdById,
      notes: backup.notes,
      databaseName: backup.databaseName,
      postgresVersion: backup.postgresVersion,
      tableCount: backup.tableCount,
      recordCount:
        backup.recordCount === null ? null : Number(backup.recordCount),
      startedAt: backup.startedAt,
      completedAt: backup.completedAt,
      durationSeconds: backup.durationSeconds,
      errorMessage: backup.errorMessage,
      errorCode: backup.errorCode,
      errorDetails: backup.errorDetails,
      checksum: backup.checksum,
      dbSchemaVersion: backup.dbSchemaVersion,
      codeSchemaVersion: backup.codeSchemaVersion,
      schemaDrift: backup.schemaDrift ?? false,
      verificationStatus: backup.verificationStatus,
      verificationError: backup.verificationError,
      deletedAt: backup.deletedAt,
      deletedById: backup.deletedById,
      createdAt: backup.createdAt,
      updatedAt: backup.updatedAt,
    });
  }

  private toPrismaUpdate(
    data: UpdateDatabaseBackupData,
  ): Record<string, unknown> {
    const mapped: Record<string, unknown> = { ...data };

    if (data.status) {
      mapped.status = data.status as PrismaBackupStatus;
    }

    if (data.stage !== undefined) {
      mapped.stage = data.stage as PrismaBackupStage | null;
    }

    if (data.fileSize !== undefined) {
      mapped.fileSize = BigInt(data.fileSize);
    }

    if (data.recordCount !== undefined) {
      mapped.recordCount =
        data.recordCount === null ? null : BigInt(data.recordCount);
    }

    return mapped;
  }
}
