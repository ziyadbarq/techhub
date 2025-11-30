import type { Container } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { PrismaDatabaseBackupRepository } from "@/infrastructure/repositories/prisma-database-backup.repository";
import { DatabaseBackupService } from "@/infrastructure/services/database-backup.service";
import {
  CreateDatabaseBackupUseCase,
  DeleteDatabaseBackupUseCase,
  GetDatabaseBackupUseCase,
  ListDatabaseBackupsUseCase,
  RestoreDatabaseFromBackupUseCase,
  CancelDatabaseBackupUseCase,
} from "@/core/use-cases/database-backup";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import type { IDatabaseBackupService } from "@/core/services/database-backup.service.interface";

export function bindDatabaseBackupDependencies(container: Container): void {
  container
    .bind<IDatabaseBackupRepository>(DI_TOKENS.IDatabaseBackupRepository)
    .to(PrismaDatabaseBackupRepository);

  container
    .bind<IDatabaseBackupService>(DI_TOKENS.IDatabaseBackupService)
    .to(DatabaseBackupService);

  container
    .bind<CreateDatabaseBackupUseCase>(DI_TOKENS.CreateDatabaseBackupUseCase)
    .to(CreateDatabaseBackupUseCase);
  container
    .bind<ListDatabaseBackupsUseCase>(DI_TOKENS.ListDatabaseBackupsUseCase)
    .to(ListDatabaseBackupsUseCase);
  container
    .bind<GetDatabaseBackupUseCase>(DI_TOKENS.GetDatabaseBackupUseCase)
    .to(GetDatabaseBackupUseCase);
  container
    .bind<DeleteDatabaseBackupUseCase>(DI_TOKENS.DeleteDatabaseBackupUseCase)
    .to(DeleteDatabaseBackupUseCase);
  container
    .bind<RestoreDatabaseFromBackupUseCase>(
      DI_TOKENS.RestoreDatabaseFromBackupUseCase,
    )
    .to(RestoreDatabaseFromBackupUseCase);
  container
    .bind<CancelDatabaseBackupUseCase>(DI_TOKENS.CancelDatabaseBackupUseCase)
    .to(CancelDatabaseBackupUseCase);
}
