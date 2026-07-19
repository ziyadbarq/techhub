/**
 * Delete LicenseEntitlement Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteLicenseEntitlementRequest {
  id: string;
}

@injectable()
export class DeleteLicenseEntitlementUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
  ) {}

  async execute(request: DeleteLicenseEntitlementRequest): Promise<void> {
    // Check if entitlement exists
    const exists = await this.entitlementRepository.exists(request.id);
    if (!exists) {
      throw new NotFoundError("License entitlement not found");
    }

    // Note: Prisma onDelete: Restrict will prevent deletion if there are allocations
    await this.entitlementRepository.delete(request.id);
  }
}
