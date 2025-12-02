/**
 * Reset Database Use Case
 * Resets the database (DEV ONLY)
 * Cleans all data and optionally reseeds
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import type {
  ISystemSeederService,
  ResetDatabaseResult,
} from "@/core/services/system-seeder.service.interface";
import { LogExecution } from "@/lib/decorators";
export type { ResetDatabaseResult } from "@/core/services/system-seeder.service.interface";

export interface ResetDatabaseRequest {
  reseed?: boolean; // Whether to reseed after reset
}

@injectable()
export class ResetDatabaseUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.ISystemSeederService)
    private readonly systemSeederService: ISystemSeederService,
  ) {}

  @LogExecution("system.database.reset")
  async execute(
    request: ResetDatabaseRequest = {},
  ): Promise<ResetDatabaseResult> {
    const { reseed = false } = request;

    // Safety check: Only allow in development
    if (process.env.NODE_ENV === "production") {
      this.logger.warn("Attempted to reset database in production");
      return {
        success: false,
        message: "Database reset is only available in development environment",
      };
    }

    this.logger.info("Starting database reset", { reseed });

    const result = await this.systemSeederService.resetDatabase({ reseed });

    if (!result.success) {
      this.logger.error("Failed to reset database", undefined, { reseed });
    }

    return result;
  }
}
