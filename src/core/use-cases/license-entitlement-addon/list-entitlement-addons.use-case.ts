/**
 * List Entitlement Addons Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementAddonRepository } from "@/core/repositories/license-entitlement-addon.repository.interface";
import type { LicenseEntitlementAddon } from "@/core/domain/entities/license-entitlement-addon.entity";

export interface ListEntitlementAddonsRequest {
  licenseEntitlementId?: string;
  licenseAddonId?: string;
}

@injectable()
export class ListEntitlementAddonsUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementAddonRepository)
    private entitlementAddonRepository: ILicenseEntitlementAddonRepository,
  ) {}

  async execute(
    request: ListEntitlementAddonsRequest = {},
  ): Promise<LicenseEntitlementAddon[]> {
    if (request.licenseEntitlementId) {
      return await this.entitlementAddonRepository.findByEntitlementId(
        request.licenseEntitlementId,
      );
    }

    if (request.licenseAddonId) {
      return await this.entitlementAddonRepository.findByAddonId(
        request.licenseAddonId,
      );
    }

    return await this.entitlementAddonRepository.findAll();
  }
}
