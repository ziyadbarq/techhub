/**
 * Attach Addon To Entitlement Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementAddonRepository } from "@/core/repositories/license-entitlement-addon.repository.interface";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { ILicenseAddonRepository } from "@/core/repositories/license-addon.repository.interface";
import { LicenseEntitlementAddon } from "@/core/domain/entities/license-entitlement-addon.entity";

export interface AttachAddonToEntitlementRequest {
  licenseEntitlementId: string;
  licenseAddonId: string;
  cost?: number | null;
  currency?: string | null;
  note?: string | null;
}

@injectable()
export class AttachAddonToEntitlementUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementAddonRepository)
    private entitlementAddonRepository: ILicenseEntitlementAddonRepository,
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
    @inject(DI_TOKENS.ILicenseAddonRepository)
    private addonRepository: ILicenseAddonRepository,
  ) {}

  async execute(
    request: AttachAddonToEntitlementRequest,
  ): Promise<LicenseEntitlementAddon> {
    // Validate entitlement exists
    const entitlement = await this.entitlementRepository.findById(
      request.licenseEntitlementId,
    );
    if (!entitlement) {
      throw new Error("License entitlement not found");
    }

    // Validate addon exists
    const addon = await this.addonRepository.findById(request.licenseAddonId);
    if (!addon) {
      throw new Error("License addon not found");
    }

    // Validate addon is active
    if (!addon.isActive) {
      throw new Error("Cannot attach inactive addon");
    }

    // Validate addon belongs to the same product as entitlement
    if (addon.licenseProductId !== entitlement.licenseProductId) {
      throw new Error("Addon does not belong to the same license product");
    }

    // Check if already attached
    const existing = await this.entitlementAddonRepository.exists(
      request.licenseEntitlementId,
      request.licenseAddonId,
    );
    if (existing) {
      throw new Error("Addon is already attached to this entitlement");
    }

    // Create attachment
    const entitlementAddon = LicenseEntitlementAddon.create({
      licenseEntitlementId: request.licenseEntitlementId,
      licenseAddonId: request.licenseAddonId,
      cost: request.cost,
      currency: request.currency,
      note: request.note,
    });

    return await this.entitlementAddonRepository.create(entitlementAddon);
  }
}
