/**
 * Update Entitlement Addon Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementAddonRepository } from "@/core/repositories/license-entitlement-addon.repository.interface";
import type { LicenseEntitlementAddon } from "@/core/domain/entities/license-entitlement-addon.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateEntitlementAddonRequest {
  id: string;
  cost?: number | null;
  currency?: string | null;
  note?: string | null;
}

@injectable()
export class UpdateEntitlementAddonUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementAddonRepository)
    private entitlementAddonRepository: ILicenseEntitlementAddonRepository,
  ) {}

  async execute(
    request: UpdateEntitlementAddonRequest,
  ): Promise<LicenseEntitlementAddon> {
    const entitlementAddon = await this.entitlementAddonRepository.findById(
      request.id,
    );
    if (!entitlementAddon) {
      throw new NotFoundError("Entitlement addon attachment not found");
    }

    entitlementAddon.update({
      cost: request.cost,
      currency: request.currency,
      note: request.note,
    });

    return await this.entitlementAddonRepository.update(entitlementAddon);
  }
}
