/**
 * Seed Minimal Data Use Case
 * Seeds minimal RBAC data required for system operation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import { seedRBAC } from "@/infrastructure/database/prisma/seed-rbac";

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
      await seedRBAC();

      this.logger.info("Minimal data seeding completed successfully");

      return {
        success: true,
        message: "Minimal RBAC data seeded successfully (269 permissions, 10 roles)",
        details: {
          rolesCreated: 10, // 10 system roles as defined in seed-rbac-roles.ts
          permissionsCreated: 269, // All permissions from permission-groups.ts
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
