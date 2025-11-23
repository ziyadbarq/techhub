/**
 * Check System Health Use Case
 * Verifies that all system requirements are met
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import type { SystemHealthCheckDto } from "@/interface-adapters/dtos/system-setup.dto";

@injectable()
export class CheckSystemHealthUseCase {
  constructor(
    @inject(DI_TOKENS.ISystemSetupRepository)
    private readonly systemSetupRepository: ISystemSetupRepository,
  ) {}

  async execute(): Promise<SystemHealthCheckDto> {
    // Check database connection
    let databaseConnected = false;
    let databaseError: string | undefined;
    try {
      databaseConnected =
        await this.systemSetupRepository.checkDatabaseConnection();
    } catch (error) {
      databaseError =
        error instanceof Error ? error.message : "Unknown database error";
    }

    // Check Redis connection
    let redisConnected = false;
    let redisError: string | undefined;
    try {
      redisConnected =
        await this.systemSetupRepository.checkRedisConnection();
    } catch (error) {
      redisError =
        error instanceof Error ? error.message : "Unknown Redis error";
    }

    // Check environment variables
    const requiredEnvVars = [
      "DATABASE_URL",
      "REDIS_URL",
      "BETTER_AUTH_SECRET",
      "BETTER_AUTH_URL",
    ];
    const missingEnvVars = requiredEnvVars.filter(
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
    } catch (error) {
      migrationsError =
        error instanceof Error ? error.message : "Unknown migrations error";
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
      },
      redis: {
        connected: redisConnected,
        error: redisError,
      },
      environment: {
        valid: environmentValid,
        missing: missingEnvVars,
      },
      migrations: {
        applied: migrationsApplied,
        pending: pendingMigrationsCount,
        error: migrationsError,
      },
      overall,
    };
  }
}
