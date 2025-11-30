import type {
  BackupStage,
  BackupStatus,
} from "@/core/domain/entities/database-backup.entity";

export interface BackupProgressEvent {
  backupId: string;
  status: BackupStatus;
  stage?: BackupStage | null;
  percentage?: number;
  currentStep?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
}

export interface CreateBackupOptions {
  backupId: string;
  filename: string;
  notes?: string | null;
  onProgress?: (progress: BackupProgressEvent) => Promise<void> | void;
}

export interface RestoreBackupOptions {
  backupId: string;
  filePath: string;
  onProgress?: (progress: BackupProgressEvent) => Promise<void> | void;
}

export interface IDatabaseBackupService {
  /**
   * Directory used to store backup files.
   */
  getBackupDirectory(): string;

  /**
   * Ensure backup directory exists and is writable.
   */
  ensureBackupDirectory(): Promise<string>;

  /**
   * Create a backup file using pg_dump with progress callbacks.
   */
  createBackupFile(options: CreateBackupOptions): Promise<{
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
  }>;

  /**
   * Restore database from an existing backup file.
   */
  restoreFromBackup(options: RestoreBackupOptions): Promise<void>;
}
