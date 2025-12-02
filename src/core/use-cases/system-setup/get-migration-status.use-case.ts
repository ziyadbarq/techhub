/**
 * Get Migration Status Use Case
 * Gets the status of database migrations
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import type { MigrationStatusDto } from "@/core/dtos/system-setup.dto";
import type { ILoggerService } from "@/core/services";
import { LogExecution } from "@/lib/decorators";

@injectable()
export class GetMigrationStatusUseCase {
  constructor(
    @inject(DI_TOKENS.ISystemSetupRepository)
    private readonly systemSetupRepository: ISystemSetupRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("system.migrations.status")
  async execute(): Promise<MigrationStatusDto> {
    const applied = await this.systemSetupRepository.getAppliedMigrations();
    const pending = await this.systemSetupRepository.getPendingMigrations();

    return {
      applied,
      pending,
      total: applied.length + pending.length,
    };
  }
}
