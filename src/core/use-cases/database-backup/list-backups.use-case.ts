import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import type { DatabaseBackup } from "@/core/domain/entities/database-backup.entity";

@injectable()
export class ListDatabaseBackupsUseCase {
  constructor(
    @inject(DI_TOKENS.IDatabaseBackupRepository)
    private readonly repository: IDatabaseBackupRepository,
  ) {}

  async execute(): Promise<DatabaseBackup[]> {
    return this.repository.findMany();
  }
}
