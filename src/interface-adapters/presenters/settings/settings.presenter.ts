/**
 * Settings Presenter
 * Transforms use case results to DTOs for API responses.
 * Masks secret values.
 */

import type { SettingWithValue } from "@/core/use-cases/settings/list-settings.use-case";
import type { SettingResponseDTO } from "../../dtos/settings/settings.dto";

const SECRET_MASK = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";

export class SettingsPresenter {
  static toDTO(setting: SettingWithValue): SettingResponseDTO {
    const { definition } = setting;
    const isSecretWithValue =
      definition.isSecret && setting.source !== "not-set";

    return {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      tab: definition.tab,
      valueType: definition.valueType,
      value: isSecretWithValue ? SECRET_MASK : setting.value,
      isSecret: definition.isSecret,
      isEditable: definition.isEditable,
      requiresRestart: definition.requiresRestart,
      enumOptions: definition.enumOptions,
      source: setting.source,
      updatedBy: setting.updatedBy,
      updatedByEmail: setting.updatedByEmail,
      updatedAt: setting.updatedAt,
      hasValue: setting.source !== "not-set",
      pendingRestart: setting.pendingRestart,
    };
  }

  static toDTOList(settings: SettingWithValue[]): SettingResponseDTO[] {
    return settings.map((s) => this.toDTO(s));
  }
}
