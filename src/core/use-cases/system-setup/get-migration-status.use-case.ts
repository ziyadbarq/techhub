/**
 * Get Migration Status Use Case
 * Gets the status of database migrations
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import type { MigrationStatusDto } from "@/interface-adapters/dtos/system-setup.dto";

@injectable()
export class GetMigrationStatusUseCase {
  constructor(
    @inject(DI_TOKENS.ISystemSetupRepository)
    private readonly systemSetupRepository: ISystemSetupRepository,
  ) {}

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
