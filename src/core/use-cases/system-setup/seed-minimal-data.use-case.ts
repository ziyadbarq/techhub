/**
 * Seed Minimal Data Use Case
 * Seeds minimal RBAC data required for system operation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import { seedRBACData } from "@/infrastructure/database/prisma/seeds/seed-rbac";

export interface SeedMinimalDataResult {
  success: boolean;
  message: string;
  details?: {
    rolesCreated: number;
    permissionsCreated: number;
  };
}

@injectable()
export class SeedMinimalDataUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(): Promise<SeedMinimalDataResult> {
    this.logger.info("Starting minimal data seeding (RBAC only)");

    try {
      // Seed RBAC data (roles and permissions)
      const result = await seedRBACData();

      this.logger.info("Minimal data seeding completed", {
        rolesCreated: result.roles?.length || 0,
        permissionsCreated: result.permissions?.length || 0,
      });

      return {
        success: true,
        message: "Minimal RBAC data seeded successfully",
        details: {
          rolesCreated: result.roles?.length || 0,
          permissionsCreated: result.permissions?.length || 0,
        },
      };
    } catch (error) {
      this.logger.error("Failed to seed minimal data", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to seed minimal data",
      };
    }
  }
}
