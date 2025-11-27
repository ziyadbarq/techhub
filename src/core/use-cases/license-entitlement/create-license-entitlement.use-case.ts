/**
 * Create LicenseEntitlement Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import { LicenseEntitlement } from "@/core/domain/entities/license-entitlement.entity";

export interface CreateLicenseEntitlementRequest {
  licenseProductId: string;
  contractId?: string | null;
  purchasedQuantity: number;
  effectiveStart: Date;
  effectiveEnd?: Date | null;
  allowedScope?: Record<string, unknown> | null;
  note?: string | null;
  unitCost?: number | null;
  currency?: string | null;
}

@injectable()
export class CreateLicenseEntitlementUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
    @inject(DI_TOKENS.ILicenseProductRepository)
    private licenseProductRepository: ILicenseProductRepository,
    @inject(DI_TOKENS.IContractRepository)
    private contractRepository: IContractRepository,
  ) {}

  async execute(
    request: CreateLicenseEntitlementRequest,
  ): Promise<LicenseEntitlement> {
    // Validate license product exists
    const licenseProduct = await this.licenseProductRepository.findById(
      request.licenseProductId,
    );
    if (!licenseProduct) {
      throw new Error("License product not found");
    }

    // Validate contract exists if provided
    if (request.contractId) {
      const contract = await this.contractRepository.findById(
        request.contractId,
      );
      if (!contract) {
        throw new Error("Contract not found");
      }
    }

    // Create the entitlement
    const entitlement = LicenseEntitlement.create({
      licenseProductId: request.licenseProductId,
      contractId: request.contractId,
      purchasedQuantity: request.purchasedQuantity,
      effectiveStart: request.effectiveStart,
      effectiveEnd: request.effectiveEnd,
      allowedScope: request.allowedScope,
      note: request.note,
      unitCost: request.unitCost,
      currency: request.currency,
    });

    return await this.entitlementRepository.create(entitlement);
  }
}
