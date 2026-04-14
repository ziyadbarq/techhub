/**
 * List Settings Use Case
 * Returns all settings merged with registry metadata and resolved values.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { ISystemSettingRepository } from "@/core/repositories/system-setting.repository.interface";
import type { IConfigService } from "@/core/services/config.service.interface";
import {
  getAllSettingDefinitions,
  type SettingDefinition,
} from "@/core/domain/value-objects/settings-registry";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

export interface SettingWithValue {
  definition: SettingDefinition;
  value: string | null;
  source: "database" | "env" | "default" | "not-set";
  updatedBy: string | null;
  updatedByEmail: string | null;
  updatedAt: Date | null;
  /** True when a restart-required setting has a DB override that was saved AFTER the last server start. */
  pendingRestart: boolean;
}

export interface ListSettingsResponse {
  settings: SettingWithValue[];
  total: number;
}

@injectable()
export class ListSettingsUseCase {
  constructor(
    @inject(DI_TOKENS.ISystemSettingRepository)
    private readonly settingRepository: ISystemSettingRepository,
    @inject(DI_TOKENS.IConfigService)
    private readonly configService: IConfigService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("settings.list")
  async execute(): Promise<ListSettingsResponse> {
    const definitions = getAllSettingDefinitions();
    const dbSettings = await this.settingRepository.findAll();
    const dbMap = new Map(dbSettings.map((s) => [s.key, s]));
    const hydrationTs = this.configService.getServerStartTimestamp();

    const settings: SettingWithValue[] = definitions.map((def) => {
      const dbSetting = dbMap.get(def.key);

      // Determine value and source
      if (dbSetting?.hasValue()) {
        // A restart-required setting needs restart only if it was updated
        // AFTER the last hydration (server start). If hydration already
        // applied it, no restart is pending.
        const needsRestart =
          def.requiresRestart &&
          (!hydrationTs || dbSetting.updatedAt > hydrationTs);

        return {
          definition: def,
          value: def.isSecret ? null : dbSetting.value,
          source: "database" as const,
          updatedBy: dbSetting.updatedBy,
          updatedByEmail: dbSetting.updatedByEmail,
          updatedAt: dbSetting.updatedAt,
          pendingRestart: needsRestart,
        };
      }

      const envValue = process.env[def.envVarName];
      if (envValue !== undefined && envValue.length > 0) {
        return {
          definition: def,
          value: def.isSecret ? null : envValue,
          source: "env" as const,
          updatedBy: null,
          updatedByEmail: null,
          updatedAt: null,
          pendingRestart: false,
        };
      }

      if (def.defaultValue !== undefined) {
        return {
          definition: def,
          value: def.defaultValue,
          source: "default" as const,
          updatedBy: null,
          updatedByEmail: null,
          updatedAt: null,
          pendingRestart: false,
        };
      }

      return {
        definition: def,
        value: null,
        source: "not-set" as const,
        updatedBy: null,
        updatedByEmail: null,
        updatedAt: null,
        pendingRestart: false,
      };
    });

    return { settings, total: settings.length };
  }
}
