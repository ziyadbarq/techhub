import type {
  BackupStage,
  BackupStatus,
  DatabaseBackup,
  DatabaseBackupProps,
} from "@/core/domain/entities/database-backup.entity";

export interface CreateDatabaseBackupData {
  filename: string;
  filePath: string;
  fileSize?: number;
  status?: BackupStatus;
  stage?: BackupStage | null;
  percentage?: number;
  currentStep?: string | null;
  createdById: string;
  notes?: string | null;
  databaseName: string;
  postgresVersion: string;
  tableCount?: number | null;
  recordCount?: number | null;
  startedAt?: Date;
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
}

export type UpdateDatabaseBackupData = Partial<
  Omit<DatabaseBackupProps, "id" | "createdAt" | "updatedAt">
>;

export interface BackupProgressUpdate {
  status?: BackupStatus;
  stage?: BackupStage | null;
  percentage?: number;
  currentStep?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  errorDetails?: string | null;
  checksum?: string | null;
  dbSchemaVersion?: string | null;
  codeSchemaVersion?: string | null;
  schemaDrift?: boolean;
  verificationStatus?: string | null;
  verificationError?: string | null;
  completedAt?: Date | null;
  durationSeconds?: number | null;
  fileSize?: number;
  tableCount?: number | null;
  recordCount?: number | null;
}

export interface DatabaseBackupQuery {
  includeDeleted?: boolean;
  statuses?: BackupStatus[];
  limit?: number;
}

export interface IDatabaseBackupRepository {
  create(data: CreateDatabaseBackupData): Promise<DatabaseBackup>;
  findById(id: string): Promise<DatabaseBackup | null>;
  findMany(query?: DatabaseBackupQuery): Promise<DatabaseBackup[]>;
  findRunning(): Promise<DatabaseBackup | null>;
  update(id: string, data: UpdateDatabaseBackupData): Promise<DatabaseBackup>;
  updateProgress(id: string, data: BackupProgressUpdate): Promise<void>;
  softDelete(id: string, deletedById: string): Promise<void>;
}
