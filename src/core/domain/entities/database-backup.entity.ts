import { randomUUID } from "node:crypto";

/**
 * Database Backup Entity
 *
 * Represents a PostgreSQL database backup along with progress and metadata.
 */

export enum BackupStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum BackupStage {
  INITIALIZING = "INITIALIZING",
  DUMPING = "DUMPING",
  COMPRESSING = "COMPRESSING",
  FINALIZING = "FINALIZING",
}

export interface DatabaseBackupProps {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number;
  status: BackupStatus;
  stage?: BackupStage | null;
  percentage: number;
  currentStep?: string | null;
  createdById: string;
  notes?: string | null;
  databaseName: string;
  postgresVersion: string;
  tableCount?: number | null;
  recordCount?: number | null;
  startedAt: Date;
  completedAt?: Date | null;
  durationSeconds?: number | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  errorDetails?: string | null;
  deletedAt?: Date | null;
  deletedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseBackup {
  constructor(private readonly props: DatabaseBackupProps) {}

  static create(
    initial: Omit<
      DatabaseBackupProps,
      "id" | "createdAt" | "updatedAt" | "startedAt" | "percentage" | "status"
    >,
  ): DatabaseBackup {
    return new DatabaseBackup({
      ...initial,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: new Date(),
      percentage: 0,
      status: BackupStatus.PENDING,
    });
  }

  toJSON(): DatabaseBackupProps {
    return { ...this.props };
  }

  withUpdates(updates: Partial<DatabaseBackupProps>): DatabaseBackup {
    return new DatabaseBackup({
      ...this.props,
      ...updates,
      updatedAt: updates.updatedAt ?? new Date(),
    });
  }
}
