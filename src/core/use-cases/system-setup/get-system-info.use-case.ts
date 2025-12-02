/**
 * Get System Info Use Case
 * Gets comprehensive system information for admin dashboard
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import type { SystemInfoDto } from "@/core/dtos/system-setup.dto";
import type { ILoggerService } from "@/core/services";
import { LogExecution } from "@/lib/decorators";

@injectable()
export class GetSystemInfoUseCase {
  constructor(
    @inject(DI_TOKENS.ISystemSetupRepository)
    private readonly systemSetupRepository: ISystemSetupRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("system.info.get")
  async execute(): Promise<SystemInfoDto> {
    // Get database info
    const databaseSize = await this.systemSetupRepository.getDatabaseSize();
    const tableCount = await this.systemSetupRepository.getTableCount();
    const lastMigration = await this.systemSetupRepository.getLastMigration();

    // Get counts
    const userCount = await this.systemSetupRepository.getUserCount();
    const roleCount = await this.systemSetupRepository.getRoleCount();
    const permissionCount =
      await this.systemSetupRepository.getPermissionCount();

    return {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || "development",
      database: {
        size: databaseSize
          ? `${(databaseSize / 1024 / 1024).toFixed(2)} MB`
          : undefined,
        tableCount,
      },
      lastMigration: lastMigration || undefined,
      userCount,
      roleCount,
      permissionCount,
    };
  }
}
