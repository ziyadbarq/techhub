/**
 * Get LicenseEntitlement Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { LicenseEntitlement } from "@/core/domain/entities/license-entitlement.entity";

export interface GetLicenseEntitlementRequest {
  id: string;
}

@injectable()
export class GetLicenseEntitlementUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
  ) {}

  async execute(
    request: GetLicenseEntitlementRequest,
  ): Promise<LicenseEntitlement> {
    const entitlement = await this.entitlementRepository.findById(request.id);

    if (!entitlement) {
      throw new Error("License entitlement not found");
    }

    return entitlement;
  }
}
