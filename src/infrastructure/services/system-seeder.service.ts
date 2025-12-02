import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  ISystemSeederService,
  ResetDatabaseOptions,
  ResetDatabaseResult,
  SeedMinimalDataResult,
} from "@/core/services/system-seeder.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { cleanupDatabase } from "@/infrastructure/database/prisma/seed-utils";
import { seedRBAC } from "@/infrastructure/database/prisma/seed-rbac";
import { SYSTEM_PERMISSIONS } from "@/infrastructure/database/prisma/seed-rbac-permissions";
import { SYSTEM_ROLES } from "@/infrastructure/database/prisma/seed-rbac-roles";
import { prisma } from "@/infrastructure/database/prisma/client";

@injectable()
export class SystemSeederService implements ISystemSeederService {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async resetDatabase(
    options: ResetDatabaseOptions = {},
  ): Promise<ResetDatabaseResult> {
    const { reseed = false } = options;

    if (process.env.NODE_ENV === "production") {
      this.logger.warn("Attempted to reset database in production");
      return {
        success: false,
        message: "Database reset is only available in development environment",
      };
    }

    this.logger.info("Starting database reset", { reseed });

    try {
      await cleanupDatabase(prisma, ["layer3", "layer2", "layer1", "rbac"]);
      this.logger.info("Database cleaned successfully");

      if (reseed) {
        await seedRBAC();
        this.logger.info("Database reseeded with RBAC data");
      }

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

  async seedMinimalData(): Promise<SeedMinimalDataResult> {
    this.logger.info("Starting minimal data seeding (RBAC only)");

    try {
      const result = (await seedRBAC()) as {
        rolesCreated?: number;
        permissionsCreated?: number;
      } | void;

      return {
        success: true,
        message: "Minimal RBAC data seeded successfully",
        details: {
          rolesCreated:
            result?.rolesCreated ?? Object.keys(SYSTEM_ROLES).length,
          permissionsCreated:
            result?.permissionsCreated ?? SYSTEM_PERMISSIONS.length,
        },
      };
    } catch (error) {
      this.logger.error(
        "Failed to seed minimal data",
        error instanceof Error ? error : undefined,
      );

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to seed minimal RBAC data",
      };
    }
  }
}
