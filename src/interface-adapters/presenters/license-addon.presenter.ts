/**
 * LicenseAddon Presenter
 */

import type { LicenseAddon } from "@/core/domain/entities/license-addon.entity";
import type { LicenseAddonDTO } from "../dtos/generated/license-addon.dto";

export type { LicenseAddonDTO };

export class LicenseAddonPresenter {
  static toDTO(addon: LicenseAddon): LicenseAddonDTO {
    return {
      id: addon.id,
      licenseProductId: addon.licenseProductId,
      name: addon.name,
      code: addon.code,
      description: addon.description,
      isActive: addon.isActive,
      createdAt: addon.createdAt,
      updatedAt: addon.updatedAt,
    };
  }

  static toDTOList(addons: LicenseAddon[]): LicenseAddonDTO[] {
    return addons.map((addon) => this.toDTO(addon));
  }
}
