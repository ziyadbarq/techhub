/**
 * Database Backup Entity
 *
 * Represents a PostgreSQL database backup along with progress and metadata.
 *
 * NOTE: This entity uses DB-generated IDs (@default(cuid()) in Prisma).
 * The create() static method is not used in production - the repository
 * creates Prisma records directly and the DB auto-generates the ID.
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
  checksum?: string | null;
  dbSchemaVersion?: string | null;
  codeSchemaVersion?: string | null;
  schemaDrift?: boolean;
  verificationStatus?: string | null;
  verificationError?: string | null;
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
      "createdAt" | "updatedAt" | "startedAt" | "percentage" | "status"
    > & {
      id?: string; // Optional for tests; in production, Prisma auto-generates
    },
  ): DatabaseBackup {
    return new DatabaseBackup({
      ...initial,
      id: initial.id || "", // Placeholder; should be set by Prisma or test
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: new Date(),
      percentage: 0,
      status: BackupStatus.PENDING,
      schemaDrift: false,
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
