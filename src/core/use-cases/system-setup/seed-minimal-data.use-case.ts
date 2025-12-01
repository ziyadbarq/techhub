/**
 * Seed Minimal Data Use Case
 * Seeds minimal RBAC data required for system operation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import type {
  ISystemSeederService,
  SeedMinimalDataResult,
} from "@/core/services/system-seeder.service.interface";

@injectable()
export class SeedMinimalDataUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.ISystemSeederService)
    private readonly systemSeederService: ISystemSeederService,
  ) {}

  async execute(): Promise<SeedMinimalDataResult> {
    this.logger.info("Starting minimal data seeding (RBAC only)");

    const result = await this.systemSeederService.seedMinimalData();

    if (!result.success) {
      this.logger.error("Failed to seed minimal data");
    }

    return result;
  }
}
