/**
 * Update Settings Bulk Use Case
 * Validates all settings upfront, then upserts atomically via a DB transaction.
 * Either all settings in a tab save or none do.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { ISystemSettingRepository } from "@/core/repositories/system-setting.repository.interface";
import type { IConfigService } from "@/core/services/config.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { SystemSetting } from "@/core/domain/entities/system-setting.entity";
import {
  getSettingDefinition,
  isValidSettingKey,
} from "@/core/domain/value-objects/settings-registry";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

export interface BulkSettingEntry {
  key: string;
  value: string | null;
}

export interface UpdateSettingsBulkRequest {
  settings: BulkSettingEntry[];
  userId: string;
  userEmail: string;
}

export interface UpdateSettingsBulkResponse {
  updated: number;
  errors: Array<{ key: string; error: string }>;
}

@injectable()
export class UpdateSettingsBulkUseCase {
  constructor(
    @inject(DI_TOKENS.ISystemSettingRepository)
    private readonly settingRepository: ISystemSettingRepository,
    @inject(DI_TOKENS.IConfigService)
    private readonly configService: IConfigService,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("settings.updateBulk")
  async execute(
    request: UpdateSettingsBulkRequest,
  ): Promise<UpdateSettingsBulkResponse> {
    const errors: Array<{ key: string; error: string }> = [];

    // Phase 1: Validate all entries upfront — fail fast before touching DB
    for (const entry of request.settings) {
      try {
        this.validateEntry(entry);
      } catch (error) {
        errors.push({
          key: entry.key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (errors.length > 0) {
      return { updated: 0, errors };
    }

    // Phase 2: Build domain entities
    const existingKeys = request.settings.map((s) => s.key);
    const existingSettings =
      await this.settingRepository.findByKeys(existingKeys);
    const existingMap = new Map(existingSettings.map((s) => [s.key, s]));

    const settingsToUpsert: SystemSetting[] = request.settings.map((entry) => {
      const existing = existingMap.get(entry.key);
      const definition = getSettingDefinition(entry.key)!;

      if (existing) {
        return existing.updateValue(
          entry.value,
          request.userId,
          request.userEmail,
        );
      }

      return SystemSetting.create(
        {
          key: entry.key,
          value: entry.value,
          isEncrypted: definition.isSecret,
          updatedBy: request.userId,
          updatedByEmail: request.userEmail,
        },
        this.idGenerator,
      );
    });

    // Phase 3: Atomic upsert via transaction
    await this.settingRepository.upsertMany(settingsToUpsert);
    this.configService.invalidateCache();

    return { updated: settingsToUpsert.length, errors: [] };
  }

  private validateEntry(entry: BulkSettingEntry): void {
    if (!isValidSettingKey(entry.key)) {
      throw new Error(`Unknown setting key: ${entry.key}`);
    }

    const definition = getSettingDefinition(entry.key)!;

    if (!definition.isEditable) {
      throw new Error(`Setting "${entry.key}" is read-only`);
    }

    if (entry.value === null || entry.value.length === 0) return;

    if (definition.valueType === "number") {
      const num = Number(entry.value);
      if (Number.isNaN(num)) {
        throw new Error(`Setting "${entry.key}" must be a valid number`);
      }
      if (
        definition.validation?.min !== undefined &&
        num < definition.validation.min
      ) {
        throw new Error(
          `Setting "${entry.key}" must be at least ${definition.validation.min}`,
        );
      }
      if (
        definition.validation?.max !== undefined &&
        num > definition.validation.max
      ) {
        throw new Error(
          `Setting "${entry.key}" must be at most ${definition.validation.max}`,
        );
      }
    }

    if (definition.valueType === "boolean") {
      if (!["true", "false", "1", "0"].includes(entry.value)) {
        throw new Error(`Setting "${entry.key}" must be true or false`);
      }
    }

    if (definition.valueType === "enum" && definition.enumOptions) {
      if (!definition.enumOptions.includes(entry.value)) {
        throw new Error(
          `Setting "${entry.key}" must be one of: ${definition.enumOptions.join(", ")}`,
        );
      }
    }

    if (definition.validation?.pattern) {
      const regex = new RegExp(definition.validation.pattern);
      if (!regex.test(entry.value)) {
        throw new Error(
          definition.validation.patternMessage ??
            `Setting "${entry.key}" has an invalid format`,
        );
      }
    }
  }
}
