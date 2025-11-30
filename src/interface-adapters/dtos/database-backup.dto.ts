import { z } from "zod";
import type {
  BackupStage,
  BackupStatus,
} from "@/core/domain/entities/database-backup.entity";

export const createBackupRequestSchema = z.object({
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
});

export type CreateBackupRequestDto = z.infer<typeof createBackupRequestSchema>;

export interface DatabaseBackupDto {
  id: string;
  filename: string;
  fileSize: number;
  status: BackupStatus;
  stage?: BackupStage | null;
  percentage: number;
  currentStep?: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  completedAt?: string | null;
  durationSeconds?: number | null;
  createdById: string;
  databaseName: string;
  postgresVersion: string;
  notes?: string | null;
  errorMessage?: string | null;
}

export interface BackupProgressDto {
  backupId: string;
  status: BackupStatus;
  stage?: BackupStage | null;
  percentage?: number;
  currentStep?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
}
