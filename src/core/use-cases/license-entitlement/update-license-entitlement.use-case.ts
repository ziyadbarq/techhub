/**
 * Update LicenseEntitlement Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { LicenseEntitlement } from "@/core/domain/entities/license-entitlement.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateLicenseEntitlementRequest {
  id: string;
  purchasedQuantity?: number;
  effectiveStart?: Date;
  effectiveEnd?: Date | null;
  allowedScope?: Record<string, unknown> | null;
  note?: string | null;
  unitCost?: number | null;
  currency?: string | null;
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
      throw new NotFoundError("License entitlement not found");
    }

    // Update the entitlement
    entitlement.update({
      purchasedQuantity: request.purchasedQuantity,
      effectiveStart: request.effectiveStart,
      effectiveEnd: request.effectiveEnd,
      allowedScope: request.allowedScope,
      note: request.note,
      unitCost: request.unitCost,
      currency: request.currency,
    });

    return await this.entitlementRepository.update(entitlement);
  }
}
