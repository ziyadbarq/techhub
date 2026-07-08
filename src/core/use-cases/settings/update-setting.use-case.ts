/**
 * Update Setting Use Case
 * Validates and upserts a single setting, then invalidates the config cache.
 */

import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
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

export interface UpdateSettingRequest {
  key: string;
  value: string | null;
  userId: string;
  userEmail: string;
}

export interface UpdateSettingResponse {
  key: string;
  updated: boolean;
}

@injectable()
export class UpdateSettingUseCase {
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

  @LogExecution("settings.update")
  async execute(request: UpdateSettingRequest): Promise<UpdateSettingResponse> {
    if (!isValidSettingKey(request.key)) {
      throw new ValidationError(`Unknown setting key: ${request.key}`);
    }

    const definition = getSettingDefinition(request.key)!;

    if (!definition.isEditable) {
      throw new ValidationError(`Setting "${request.key}" is read-only`);
    }

    // Validate value against definition
    this.validateValue(request.key, request.value, definition);

    // Find existing or create new
    const existing = await this.settingRepository.findByKey(request.key);

    let setting: SystemSetting;
    if (existing) {
      setting = existing.updateValue(
        request.value,
        request.userId,
        request.userEmail,
      );
    } else {
      setting = SystemSetting.create(
        {
          key: request.key,
          value: request.value,
          isEncrypted: definition.isSecret,
          updatedBy: request.userId,
          updatedByEmail: request.userEmail,
        },
        this.idGenerator,
      );
    }

    await this.settingRepository.upsert(setting);
    this.configService.invalidateCache(request.key);

    return { key: request.key, updated: true };
  }

  private validateValue(
    key: string,
    value: string | null,
    definition: ReturnType<typeof getSettingDefinition> & object,
  ): void {
    if (value === null || value.length === 0) return; // Null means "reset to env fallback"

    if (definition.valueType === "number") {
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new ValidationError(`Setting "${key}" must be a valid number`);
      }
      if (
        definition.validation?.min !== undefined &&
        num < definition.validation.min
      ) {
        throw new ValidationError(
          `Setting "${key}" must be at least ${definition.validation.min}`,
        );
      }
      if (
        definition.validation?.max !== undefined &&
        num > definition.validation.max
      ) {
        throw new ValidationError(
          `Setting "${key}" must be at most ${definition.validation.max}`,
        );
      }
    }

    if (definition.valueType === "boolean") {
      if (!["true", "false", "1", "0"].includes(value)) {
        throw new ValidationError(`Setting "${key}" must be true or false`);
      }
    }

    if (definition.valueType === "enum" && definition.enumOptions) {
      if (!definition.enumOptions.includes(value)) {
        throw new ValidationError(
          `Setting "${key}" must be one of: ${definition.enumOptions.join(", ")}`,
        );
      }
    }

    if (definition.validation?.pattern) {
      const regex = new RegExp(definition.validation.pattern);
      if (!regex.test(value)) {
        throw new ValidationError(
          definition.validation.patternMessage ??
            `Setting "${key}" has an invalid format`,
        );
      }
    }
  }
}
