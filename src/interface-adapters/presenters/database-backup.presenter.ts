import type { DatabaseBackup } from "@/core/domain/entities/database-backup.entity";
import type { DatabaseBackupDto } from "@/interface-adapters/dtos/database-backup.dto";

export class DatabaseBackupPresenter {
  static toDto(backup: DatabaseBackup): DatabaseBackupDto {
    const props = backup.toJSON();
    return {
      id: props.id,
      filename: props.filename,
      fileSize: props.fileSize,
      status: props.status,
      stage: props.stage ?? null,
      percentage: props.percentage,
      currentStep: props.currentStep ?? null,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
      startedAt: props.startedAt.toISOString(),
      completedAt: props.completedAt?.toISOString() ?? null,
      durationSeconds: props.durationSeconds ?? null,
      createdById: props.createdById,
      databaseName: props.databaseName,
      postgresVersion: props.postgresVersion,
      notes: props.notes ?? null,
      errorMessage: props.errorMessage ?? null,
    };
  }

  static listToDto(backups: DatabaseBackup[]): DatabaseBackupDto[] {
    return backups.map((backup) => this.toDto(backup));
  }
}
