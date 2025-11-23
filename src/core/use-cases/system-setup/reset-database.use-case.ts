/**
 * Reset Database Use Case
 * Resets the database (DEV ONLY)
 * Cleans all data and optionally reseeds
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import { runSeed } from "@/infrastructure/database/prisma/seeds/seed";

export interface ResetDatabaseRequest {
  reseed?: boolean; // Whether to reseed after reset
}

export interface ResetDatabaseResult {
  success: boolean;
  message: string;
}

@injectable()
export class ResetDatabaseUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

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

    try {
      // Run the full seed script which includes cleanup
      if (reseed) {
        await runSeed();
      } else {
        // TODO: Implement cleanup-only logic
        // For now, we'll just run the full seed which includes cleanup
        await runSeed();
      }

      this.logger.info("Database reset completed", { reseed });

      return {
        success: true,
        message: reseed
          ? "Database reset and reseeded successfully"
          : "Database reset successfully",
      };
    } catch (error) {
      this.logger.error("Failed to reset database", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to reset database",
      };
    }
  }
}
