/**
 * ConfigService Implementation
 * Resolves setting values: DB → env var → default value
 * In-memory cache with 60s TTL to minimize DB reads.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IConfigService } from "@/core/services/config.service.interface";
import type { ISystemSettingRepository } from "@/core/repositories/system-setting.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { getSettingDefinition } from "@/core/domain/value-objects/settings-registry";

interface CacheEntry {
  value: string | null;
  expiry: number;
}

const CACHE_TTL_MS = 60_000; // 1 minute

@injectable()
export class ConfigService implements IConfigService {
  private cache = new Map<string, CacheEntry>();

  constructor(
    @inject(DI_TOKENS.ISystemSettingRepository)
    private readonly settingRepository: ISystemSettingRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async get(key: string): Promise<string | undefined> {
    // 1. Check in-memory cache
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.value ?? undefined;
    }

    const definition = getSettingDefinition(key);

    // 2. Try DB
    try {
      const dbSetting = await this.settingRepository.findByKey(key);
      if (dbSetting?.hasValue()) {
        this.cache.set(key, {
          value: dbSetting.value,
          expiry: Date.now() + CACHE_TTL_MS,
        });
        return dbSetting.value!;
      }
    } catch (error) {
      this.logger.warn("Failed to read setting from DB, falling back to env", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 3. Fallback to env var
    const envVarName = definition?.envVarName ?? key;
    const envValue = process.env[envVarName];
    if (envValue !== undefined && envValue.length > 0) {
      this.cache.set(key, {
        value: envValue,
        expiry: Date.now() + CACHE_TTL_MS,
      });
      return envValue;
    }

    // 4. Fallback to default
    if (definition?.defaultValue !== undefined) {
      return definition.defaultValue;
    }

    return undefined;
  }

  async getString(key: string): Promise<string | undefined> {
    return this.get(key);
  }

  async getNumber(key: string): Promise<number | undefined> {
    const value = await this.get(key);
    if (value === undefined) return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  }

  async getBoolean(key: string): Promise<boolean | undefined> {
    const value = await this.get(key);
    if (value === undefined) return undefined;
    return value === "true" || value === "1";
  }

  async getOrThrow(key: string): Promise<string> {
    const value = await this.get(key);
    if (value === undefined) {
      throw new Error(`Required setting "${key}" is not configured`);
    }
    return value;
  }

  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
