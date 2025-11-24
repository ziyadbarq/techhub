/**
 * Check System Health Use Case
 * Verifies that all system requirements are met
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import type { SystemHealthCheckDto } from "@/interface-adapters/dtos/system-setup.dto";

@injectable()
export class CheckSystemHealthUseCase {
  constructor(
    @inject(DI_TOKENS.ISystemSetupRepository)
    private readonly systemSetupRepository: ISystemSetupRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(): Promise<SystemHealthCheckDto> {
    // Check database connection
    let databaseConnected = false;
    let databaseError: string | undefined;
    try {
      databaseConnected =
        await this.systemSetupRepository.checkDatabaseConnection();
    } catch (_error) {
      databaseError =
        _error instanceof Error ? _error.message : "Unknown database error";
    }

    // Check Redis connection
    let redisConnected = false;
    let redisError: string | undefined;
    try {
      redisConnected = await this.systemSetupRepository.checkRedisConnection();
    } catch (_error) {
      redisError =
        _error instanceof Error ? _error.message : "Unknown Redis error";
    }

    // Check environment variables
    const requiredEnvVars = [
      "DATABASE_URL",
      "REDIS_URL",
      "AUTH_SECRET", // Changed from BETTER_AUTH_SECRET
      "BETTER_AUTH_URL",
    ];
    const missingEnvVars: string[] = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );
    const environmentValid = missingEnvVars.length === 0;

    // Check migrations
    let migrationsApplied = false;
    let pendingMigrationsCount = 0;
    let migrationsError: string | undefined;
    try {
      migrationsApplied =
        await this.systemSetupRepository.areMigrationsApplied();
      pendingMigrationsCount =
        await this.systemSetupRepository.getPendingMigrationsCount();
    } catch (_error) {
      const errorMsg =
        _error instanceof Error ? _error.message : "Unknown migrations error";
      // Simplify error message for missing migrations table
      if (
        errorMsg.includes("_prisma_migrations") &&
        errorMsg.includes("does not exist")
      ) {
        migrationsError = "Migrations not yet applied. Run: npm run db:migrate";
      } else {
        migrationsError = errorMsg;
      }
    }

    // Check RBAC data
    let rolesCount = 0;
    let permissionsCount = 0;
    try {
      const roles = await this.roleRepository.findAll();
      const permissions = await this.permissionRepository.findAll();
      rolesCount = roles.length;
      permissionsCount = permissions.length;
    } catch (_error) {
      // Ignore RBAC check errors - database may not be seeded yet
      rolesCount = 0;
      permissionsCount = 0;
    }

    // Overall health
    const overall =
      databaseConnected &&
      redisConnected &&
      environmentValid &&
      migrationsApplied;

    return {
      database: {
        connected: databaseConnected,
        error: databaseError,
        message: databaseConnected ? "Connected" : "Disconnected",
      },
      redis: {
        connected: redisConnected,
        error: redisError,
        message: redisConnected ? "Connected" : "Disconnected",
      },
      environment: {
        valid: environmentValid,
        missing: missingEnvVars,
      },
      migrations: {
        applied: migrationsApplied,
        pending: pendingMigrationsCount,
        error: migrationsError,
        message: migrationsApplied
          ? "All migrations applied"
          : `${pendingMigrationsCount} pending migrations`,
      },
      rbac: {
        roles: rolesCount,
        permissions: permissionsCount,
      },
      overall,
    };
  }
}
