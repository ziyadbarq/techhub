import fs from "node:fs/promises";
import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import {
  BackupStatus,
  type DatabaseBackup,
} from "@/core/domain/entities/database-backup.entity";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import type { ILoggerService } from "@/core/services";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteDatabaseBackupInput {
  backupId: string;
  deletedById: string;
}

@injectable()
export class DeleteDatabaseBackupUseCase {
  constructor(
    @inject(DI_TOKENS.IDatabaseBackupRepository)
    private readonly repository: IDatabaseBackupRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: DeleteDatabaseBackupInput): Promise<DatabaseBackup> {
    const backup = await this.repository.findById(input.backupId);
    if (!backup) {
      throw new NotFoundError("Backup not found");
    }

    if (backup.toJSON().status === BackupStatus.RUNNING) {
      throw new Error("Cannot delete a backup while it is running");
    }

    await this.repository.softDelete(input.backupId, input.deletedById);

    // Attempt to delete physical file (best effort)
    try {
      await fs.unlink(backup.toJSON().filePath);
    } catch (error) {
      this.logger.warn("Failed to delete backup file from disk", {
        backupId: input.backupId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return backup;
  }
}
