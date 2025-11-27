/**
 * Detach Addon From Entitlement Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementAddonRepository } from "@/core/repositories/license-entitlement-addon.repository.interface";

@injectable()
export class DetachAddonFromEntitlementUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementAddonRepository)
    private entitlementAddonRepository: ILicenseEntitlementAddonRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const entitlementAddon = await this.entitlementAddonRepository.findById(id);
    if (!entitlementAddon) {
      throw new Error("Entitlement addon attachment not found");
    }

    await this.entitlementAddonRepository.delete(id);
  }
}
