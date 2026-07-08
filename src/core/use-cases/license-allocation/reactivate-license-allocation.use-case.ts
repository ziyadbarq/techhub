/**
 * Reactivate LicenseAllocation Use Case
 * Reactivates a previously deallocated allocation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { IUnitOfWork } from "@/core/services/unit-of-work.service.interface";
import type { LicenseAllocation } from "@/core/domain/entities/license-allocation.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface ReactivateLicenseAllocationRequest {
  id: string;
}

@injectable()
export class ReactivateLicenseAllocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAllocationRepository)
    private allocationRepository: ILicenseAllocationRepository,
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
    @inject(DI_TOKENS.IUnitOfWork)
    private unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    request: ReactivateLicenseAllocationRequest,
  ): Promise<LicenseAllocation> {
    // Reactivation puts the allocation's quantity back into consumption, so
    // it must pass the same locked availability check as a new allocation.
    return this.unitOfWork.execute(async () => {
      // Find existing allocation
      const allocation = await this.allocationRepository.findById(request.id);
      if (!allocation) {
        throw new NotFoundError("License allocation not found");
      }

      if (allocation.isActive()) {
        throw new Error("This allocation is already active");
      }

      const entitlement = await this.entitlementRepository.findByIdForUpdate(
        allocation.licenseEntitlementId,
      );
      if (!entitlement) {
        throw new NotFoundError("License entitlement not found");
      }

      const consumedQuantity =
        await this.allocationRepository.sumActiveAllocatedQuantityByEntitlement(
          allocation.licenseEntitlementId,
        );

      if (
        !entitlement.hasAvailableQuantity(
          consumedQuantity + allocation.allocatedQuantity,
        )
      ) {
        const available =
          entitlement.calculateAvailableQuantity(consumedQuantity);
        throw new Error(
          `Insufficient quantity available to reactivate. Requested: ${allocation.allocatedQuantity}, Available: ${available}`,
        );
      }

      // Reactivate
      allocation.reactivate();

      return this.allocationRepository.update(allocation);
    });
  }
}
