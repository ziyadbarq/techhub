/**
 * List LicenseEntitlements Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { LicenseEntitlement } from "@/core/domain/entities/license-entitlement.entity";

export interface ListLicenseEntitlementsRequest {
  licenseProductId?: string;
  contractId?: string;
  activeOnly?: boolean;
  asOfDate?: Date;
}

@injectable()
export class ListLicenseEntitlementsUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
  ) {}

  async execute(
    request: ListLicenseEntitlementsRequest = {},
  ): Promise<LicenseEntitlement[]> {
    // Filter by license product if specified
    if (request.licenseProductId) {
      if (request.activeOnly) {
        return await this.entitlementRepository.findActiveByLicenseProductId(
          request.licenseProductId,
          request.asOfDate,
        );
      }
      return await this.entitlementRepository.findByLicenseProductId(
        request.licenseProductId,
      );
    }

    // Filter by contract if specified
    if (request.contractId) {
      return await this.entitlementRepository.findByContractId(
        request.contractId,
      );
    }

    // Return all entitlements
    return await this.entitlementRepository.findAll();
  }
}
