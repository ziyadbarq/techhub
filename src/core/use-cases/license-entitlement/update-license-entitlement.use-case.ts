/**
 * Update LicenseEntitlement Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { LicenseEntitlement } from "@/core/domain/entities/license-entitlement.entity";

export interface UpdateLicenseEntitlementRequest {
  id: string;
  purchasedQuantity?: number;
  effectiveStart?: Date;
  effectiveEnd?: Date | null;
  allowedScope?: Record<string, unknown> | null;
  note?: string | null;
}

@injectable()
export class UpdateLicenseEntitlementUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
  ) {}

  async execute(
    request: UpdateLicenseEntitlementRequest,
  ): Promise<LicenseEntitlement> {
    // Find existing entitlement
    const entitlement = await this.entitlementRepository.findById(request.id);
    if (!entitlement) {
      throw new Error("License entitlement not found");
    }

    // Update the entitlement
    entitlement.update({
      purchasedQuantity: request.purchasedQuantity,
      effectiveStart: request.effectiveStart,
      effectiveEnd: request.effectiveEnd,
      allowedScope: request.allowedScope,
      note: request.note,
    });

    return await this.entitlementRepository.update(entitlement);
  }
}
