/**
 * Delete LicenseAddon Use Case
 */

import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAddonRepository } from "@/core/repositories/license-addon.repository.interface";
import type { ILicenseEntitlementAddonRepository } from "@/core/repositories/license-entitlement-addon.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class DeleteLicenseAddonUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAddonRepository)
    private addonRepository: ILicenseAddonRepository,
    @inject(DI_TOKENS.ILicenseEntitlementAddonRepository)
    private entitlementAddonRepository: ILicenseEntitlementAddonRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const addon = await this.addonRepository.findById(id);
    if (!addon) {
      throw new NotFoundError("License addon not found");
    }

    // Check if addon is attached to any entitlements
    const attachments = await this.entitlementAddonRepository.findByAddonId(id);
    if (attachments.length > 0) {
      throw new ValidationError(
        `Cannot delete addon: it is attached to ${attachments.length} entitlement(s). Detach or deactivate instead.`,
      );
    }

    await this.addonRepository.delete(id);
  }
}
