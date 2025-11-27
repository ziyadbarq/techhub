/**
 * List LicenseAddons Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAddonRepository } from "@/core/repositories/license-addon.repository.interface";
import type { LicenseAddon } from "@/core/domain/entities/license-addon.entity";

export interface ListLicenseAddonsRequest {
  licenseProductId?: string;
  activeOnly?: boolean;
}

@injectable()
export class ListLicenseAddonsUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAddonRepository)
    private addonRepository: ILicenseAddonRepository,
  ) {}

  async execute(
    request: ListLicenseAddonsRequest = {},
  ): Promise<LicenseAddon[]> {
    if (request.licenseProductId) {
      if (request.activeOnly) {
        return await this.addonRepository.findActiveByLicenseProductId(
          request.licenseProductId,
        );
      }
      return await this.addonRepository.findByLicenseProductId(
        request.licenseProductId,
      );
    }

    return await this.addonRepository.findAll();
  }
}
