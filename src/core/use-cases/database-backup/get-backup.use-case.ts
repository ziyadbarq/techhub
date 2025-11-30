import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import type { DatabaseBackup } from "@/core/domain/entities/database-backup.entity";

@injectable()
export class GetDatabaseBackupUseCase {
  constructor(
    @inject(DI_TOKENS.IDatabaseBackupRepository)
    private readonly repository: IDatabaseBackupRepository,
  ) {}

  async execute(id: string): Promise<DatabaseBackup | null> {
    return this.repository.findById(id);
  }
}
