/**
 * Prisma System Setup Repository Implementation
 */

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import { createRepositoryLogger } from "./repository-logger";
import Redis from "ioredis";

@injectable()
export class PrismaSystemSetupRepository implements ISystemSetupRepository {
  private readonly logger = createRepositoryLogger("SystemSetupRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient) private readonly prisma: PrismaClient,
  ) {}

  async checkDatabaseConnection(): Promise<boolean> {
    const timer = this.logger.startTimer();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.timed(
        "checkDatabaseConnection",
        "Database connection check passed",
        timer(),
      );
      return true;
    } catch (error) {
      this.logger.timed(
        "checkDatabaseConnection",
        "Database connection check failed",
        timer(),
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
      return false;
    }
  }

  async checkRedisConnection(): Promise<boolean> {
    const timer = this.logger.startTimer();
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.logger.timed(
        "checkRedisConnection",
        "Redis URL not configured",
        timer(),
      );
      return false;
    }

    try {
      const client = new Redis(redisUrl);
      await client.ping();
      await client.quit();
      this.logger.timed(
        "checkRedisConnection",
        "Redis connection check passed",
        timer(),
      );
      return true;
    } catch (error) {
      this.logger.timed(
        "checkRedisConnection",
        "Redis connection check failed",
        timer(),
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
      return false;
    }
  }

  async getPendingMigrationsCount(): Promise<number> {
    const timer = this.logger.startTimer();
    try {
      // Check if there are pending migrations by querying Prisma's migration table
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "_prisma_migrations"
        WHERE finished_at IS NULL
      `;
      const count = Number(result[0]?.count || 0);
      this.logger.timed(
        "getPendingMigrationsCount",
        "Pending migrations counted",
        timer(),
        { count },
      );
      return count;
    } catch (error) {
      this.logger.timed(
        "getPendingMigrationsCount",
        "Failed to count pending migrations",
        timer(),
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
      // If the table doesn't exist, we need to throw so areMigrationsApplied knows
      throw error;
    }
  }

  async areMigrationsApplied(): Promise<boolean> {
    try {
      const pendingCount = await this.getPendingMigrationsCount();
      return pendingCount === 0;
    } catch (_error) {
      // If we can't query the migrations table, migrations haven't been applied
      return false;
    }
  }

  async getAppliedMigrations(): Promise<string[]> {
    const timer = this.logger.startTimer();
    try {
      const result = await this.prisma.$queryRaw<
        Array<{ migration_name: string }>
      >`
        SELECT migration_name
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
      `;
      const migrations = result.map((r) => r.migration_name);
      this.logger.timed(
        "getAppliedMigrations",
        "Applied migrations fetched",
        timer(),
        { count: migrations.length },
      );
      return migrations;
    } catch (error) {
      this.logger.timed(
        "getAppliedMigrations",
        "Failed to fetch applied migrations",
        timer(),
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
      return [];
    }
  }

  async getPendingMigrations(): Promise<string[]> {
    const timer = this.logger.startTimer();
    try {
      const result = await this.prisma.$queryRaw<
        Array<{ migration_name: string }>
      >`
        SELECT migration_name
        FROM "_prisma_migrations"
        WHERE finished_at IS NULL
        ORDER BY started_at DESC
      `;
      const migrations = result.map((r) => r.migration_name);
      this.logger.timed(
        "getPendingMigrations",
        "Pending migrations fetched",
        timer(),
        { count: migrations.length },
      );
      return migrations;
    } catch (error) {
      this.logger.timed(
        "getPendingMigrations",
        "Failed to fetch pending migrations",
        timer(),
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
      return [];
    }
  }

  async getUserCount(): Promise<number> {
    const timer = this.logger.startTimer();
    const count = await this.prisma.user.count();
    this.logger.timed("getUserCount", "Users counted", timer(), { count });
    return count;
  }

  async getRoleCount(): Promise<number> {
    const timer = this.logger.startTimer();
    const count = await this.prisma.role.count();
    this.logger.timed("getRoleCount", "Roles counted", timer(), { count });
    return count;
  }

  async getPermissionCount(): Promise<number> {
    const timer = this.logger.startTimer();
    const count = await this.prisma.permission.count();
    this.logger.timed("getPermissionCount", "Permissions counted", timer(), {
      count,
    });
    return count;
  }

  async getSeedStatus(): Promise<{
    organizationUnits: number;
    locations: number;
    vendors: number;
    featureFlags: number;
    services: number;
  }> {
    const timer = this.logger.startTimer();
    const safeCount = (p: Promise<number>) => p.then((n) => n).catch(() => 0);
    const [organizationUnits, locations, vendors, featureFlags, services] =
      await Promise.all([
        safeCount(this.prisma.organizationUnit.count()),
        safeCount(this.prisma.location.count()),
        safeCount(this.prisma.vendor.count()),
        safeCount(this.prisma.featureFlag.count()),
        safeCount(this.prisma.service.count()),
      ]);
    this.logger.timed("getSeedStatus", "Seed status counts fetched", timer(), {
      organizationUnits,
      locations,
      vendors,
      featureFlags,
      services,
    });
    return {
      organizationUnits,
      locations,
      vendors,
      featureFlags,
      services,
    };
  }

  async getDatabaseSize(): Promise<number | null> {
    const timer = this.logger.startTimer();
    try {
      // PostgreSQL-specific query to get database size
      const result = await this.prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) as size
      `;
      const size = Number(result[0]?.size || 0);
      this.logger.timed("getDatabaseSize", "Database size fetched", timer(), {
        sizeBytes: size,
      });
      return size;
    } catch (error) {
      this.logger.timed(
        "getDatabaseSize",
        "Failed to get database size",
        timer(),
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
      return null;
    }
  }

  async getTableCount(): Promise<number> {
    const timer = this.logger.startTimer();
    try {
      // PostgreSQL-specific query to count tables in public schema
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `;
      const count = Number(result[0]?.count || 0);
      this.logger.timed("getTableCount", "Tables counted", timer(), { count });
      return count;
    } catch (error) {
      this.logger.timed("getTableCount", "Failed to count tables", timer(), {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return 0;
    }
  }

  async getLastMigration(): Promise<{
    name: string;
    appliedAt: Date;
  } | null> {
    const timer = this.logger.startTimer();
    try {
      const result = await this.prisma.$queryRaw<
        Array<{ migration_name: string; finished_at: Date }>
      >`
        SELECT migration_name, finished_at
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT 1
      `;

      if (result.length === 0) {
        this.logger.timed("getLastMigration", "No migrations found", timer());
        return null;
      }

      const migration = {
        name: result[0].migration_name,
        appliedAt: result[0].finished_at,
      };

      this.logger.timed("getLastMigration", "Last migration fetched", timer(), {
        migration: migration.name,
      });

      return migration;
    } catch (error) {
      this.logger.timed(
        "getLastMigration",
        "Failed to get last migration",
        timer(),
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
      return null;
    }
  }
}
