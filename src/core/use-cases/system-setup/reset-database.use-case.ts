/**
 * Reset Database Use Case
 * Resets the database (DEV ONLY)
 * Cleans all data and optionally reseeds
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import { seedRBAC } from "@/infrastructure/database/prisma/seed-rbac";
import { cleanupDatabase } from "@/infrastructure/database/prisma/seed-utils";
import { prisma } from "@/infrastructure/database/prisma/client";

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
      // Clean all data from all layers (Layer 3 → Layer 2 → Layer 1 → RBAC)
      this.logger.info("Cleaning database (deleting all data)...");
      await cleanupDatabase(prisma, ["layer3", "layer2", "layer1", "rbac"]);
      this.logger.info("Database cleaned successfully");

      // For system setup, we only provide minimal RBAC seeding
      // Full database seeding should be done via npm scripts (npm run seed)
      if (reseed) {
        this.logger.info("Reseeding RBAC data...");
        await seedRBAC();
        this.logger.info("Database reseeded with RBAC data");
      }

      this.logger.info("Database reset completed", { reseed });

      return {
        success: true,
        message: reseed
          ? "Database reset and reseeded with RBAC data (269 permissions, 10 roles)"
          : "Database reset successfully. Run 'npm run seed' for full test data.",
      };
    } catch (error) {
      this.logger.error(
        "Failed to reset database",
        error instanceof Error ? error : undefined,
        { reseed },
      );

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to reset database",
      };
    }
  }
}
