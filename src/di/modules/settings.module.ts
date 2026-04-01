/**
 * Settings Module
 * Binds all system settings dependencies (repository, config service, use cases)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

// Repository
import type { ISystemSettingRepository } from "@/core/repositories/system-setting.repository.interface";
import { PrismaSystemSettingRepository } from "@/infrastructure/repositories/prisma-system-setting.repository";

// Config Service
import type { IConfigService } from "@/core/services/config.service.interface";
import { ConfigService } from "@/infrastructure/services/config/config.service";

// Use Cases
import { ListSettingsUseCase } from "@/core/use-cases/settings/list-settings.use-case";
import { GetSettingUseCase } from "@/core/use-cases/settings/get-setting.use-case";
import { UpdateSettingUseCase } from "@/core/use-cases/settings/update-setting.use-case";
import { UpdateSettingsBulkUseCase } from "@/core/use-cases/settings/update-settings-bulk.use-case";

export function bindSettingsDependencies(container: Container): void {
  // ==========================================
  // Repository
  // ==========================================

  container
    .bind<ISystemSettingRepository>(DI_TOKENS.ISystemSettingRepository)
    .to(PrismaSystemSettingRepository)
    .inSingletonScope();

  // ==========================================
  // Config Service
  // ==========================================

  container
    .bind<IConfigService>(DI_TOKENS.IConfigService)
    .to(ConfigService)
    .inSingletonScope();

  // ==========================================
  // Use Cases
  // ==========================================

  container
    .bind(DI_TOKENS.ListSettingsUseCase)
    .to(ListSettingsUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.GetSettingUseCase)
    .to(GetSettingUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.UpdateSettingUseCase)
    .to(UpdateSettingUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.UpdateSettingsBulkUseCase)
    .to(UpdateSettingsBulkUseCase)
    .inTransientScope();
}
