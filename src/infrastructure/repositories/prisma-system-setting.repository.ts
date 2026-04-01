/**
 * Prisma System Setting Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { SystemSetting as PrismaSystemSetting } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { SystemSetting } from "@/core/domain/entities/system-setting.entity";
import type { ISystemSettingRepository } from "@/core/repositories/system-setting.repository.interface";
import { getSettingDefinition } from "@/core/domain/value-objects/settings-registry";
import { encrypt, decrypt } from "@/lib/auth/encryption";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaSystemSettingRepository implements ISystemSettingRepository {
  private readonly logger = createRepositoryLogger("SystemSettingRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async findByKey(key: string): Promise<SystemSetting | null> {
    const record = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<SystemSetting[]> {
    const records = await this.prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });

    return records.map((r) => this.toDomain(r));
  }

  async findByKeys(keys: string[]): Promise<SystemSetting[]> {
    const records = await this.prisma.systemSetting.findMany({
      where: { key: { in: keys } },
      orderBy: { key: "asc" },
    });

    return records.map((r) => this.toDomain(r));
  }

  async upsert(setting: SystemSetting): Promise<SystemSetting> {
    const timer = this.logger.startTimer();

    try {
      const data = this.toPersistence(setting);
      const record = await this.prisma.systemSetting.upsert({
        where: { key: setting.key },
        create: {
          id: setting.id,
          key: data.key,
          value: data.value,
          isEncrypted: data.isEncrypted,
          updatedBy: data.updatedBy,
          updatedByEmail: data.updatedByEmail,
        },
        update: {
          value: data.value,
          isEncrypted: data.isEncrypted,
          updatedBy: data.updatedBy,
          updatedByEmail: data.updatedByEmail,
        },
      });

      this.logger.timed("upsert", "Setting upserted", timer(), {
        key: setting.key,
      });
      return this.toDomain(record);
    } catch (error) {
      this.logger.error("upsert", "Failed to upsert setting", error);
      throw error;
    }
  }

  async upsertMany(settings: SystemSetting[]): Promise<SystemSetting[]> {
    const timer = this.logger.startTimer();

    try {
      const operations = settings.map((setting) => {
        const data = this.toPersistence(setting);
        return this.prisma.systemSetting.upsert({
          where: { key: setting.key },
          create: {
            id: setting.id,
            key: data.key,
            value: data.value,
            isEncrypted: data.isEncrypted,
            updatedBy: data.updatedBy,
            updatedByEmail: data.updatedByEmail,
          },
          update: {
            value: data.value,
            isEncrypted: data.isEncrypted,
            updatedBy: data.updatedBy,
            updatedByEmail: data.updatedByEmail,
          },
        });
      });

      const records = await this.prisma.$transaction(operations);

      this.logger.timed(
        "upsertMany",
        "Settings upserted in transaction",
        timer(),
        {
          count: records.length,
          keys: settings.map((s) => s.key),
        },
      );
      return records.map((r) => this.toDomain(r));
    } catch (error) {
      this.logger.error(
        "upsertMany",
        "Failed to upsert settings in transaction",
        error,
      );
      throw error;
    }
  }

  private toDomain(record: PrismaSystemSetting): SystemSetting {
    let value = record.value;

    // Decrypt if stored encrypted
    if (record.isEncrypted && value) {
      try {
        value = decrypt(value);
      } catch {
        this.logger.error(
          "toDomain",
          "Failed to decrypt setting value",
          new Error("Decryption failed"),
          { key: record.key },
        );
        value = null;
      }
    }

    return SystemSetting.fromPersistence({
      id: record.id,
      key: record.key,
      value,
      isEncrypted: record.isEncrypted,
      updatedBy: record.updatedBy,
      updatedByEmail: record.updatedByEmail,
      updatedAt: record.updatedAt,
      createdAt: record.createdAt,
    });
  }

  private toPersistence(
    setting: SystemSetting,
  ): Omit<PrismaSystemSetting, "updatedAt" | "createdAt"> {
    const definition = getSettingDefinition(setting.key);
    const shouldEncrypt = definition?.isSecret ?? false;

    let value = setting.value;
    if (shouldEncrypt && value) {
      value = encrypt(value);
    }

    return {
      id: setting.id,
      key: setting.key,
      value,
      isEncrypted: shouldEncrypt && value !== null,
      updatedBy: setting.updatedBy,
      updatedByEmail: setting.updatedByEmail,
    };
  }
}
