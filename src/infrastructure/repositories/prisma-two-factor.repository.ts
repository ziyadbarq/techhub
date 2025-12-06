/**
 * Prisma Two-Factor Authentication Repository
 *
 * Implements ITwoFactorRepository using Prisma ORM for PostgreSQL.
 *
 * Layer: Infrastructure
 * Pattern: Repository Pattern
 * Dependencies: Prisma Client, Domain Entities
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { ITwoFactorRepository } from "@/core/repositories/two-factor.repository.interface";
import { TwoFactorConfig } from "@/core/domain/entities/two-factor-config.entity";

@injectable()
export class PrismaTwoFactorRepository implements ITwoFactorRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async findByUserId(userId: string): Promise<TwoFactorConfig | null> {
    const record = await this.prisma.twoFactor.findUnique({
      where: { userId },
    });

    if (!record) {
      return null;
    }

    return TwoFactorConfig.fromPersistence({
      id: record.id,
      userId: record.userId,
      secret: record.secret,
      backupCodes: record.backupCodes || "[]",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async create(config: TwoFactorConfig): Promise<TwoFactorConfig> {
    const data = config.toPersistence();
    const record = await this.prisma.twoFactor.create({
      data: {
        userId: data.userId,
        secret: data.secret,
        backupCodes: data.backupCodes,
      },
    });

    return TwoFactorConfig.fromPersistence({
      id: record.id,
      userId: record.userId,
      secret: record.secret,
      backupCodes: record.backupCodes || "[]",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async update(config: TwoFactorConfig): Promise<TwoFactorConfig> {
    if (!config.id) {
      throw new Error("Cannot update 2FA config without ID");
    }

    const data = config.toPersistence();
    const record = await this.prisma.twoFactor.update({
      where: { id: config.id },
      data: {
        secret: data.secret,
        backupCodes: data.backupCodes,
        updatedAt: new Date(),
      },
    });

    return TwoFactorConfig.fromPersistence({
      id: record.id,
      userId: record.userId,
      secret: record.secret,
      backupCodes: record.backupCodes || "[]",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async delete(userId: string): Promise<boolean> {
    try {
      await this.prisma.twoFactor.delete({
        where: { userId },
      });
      return true;
    } catch (error) {
      // P2025: Record not found
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "P2025") {
          return false;
        }
      }
      throw error;
    }
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.prisma.twoFactor.count({
      where: { userId },
    });
    return count > 0;
  }
}
