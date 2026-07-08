/**
 * Update LicenseAllocation Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { IUnitOfWork } from "@/core/services/unit-of-work.service.interface";
import type { LicenseAllocation } from "@/core/domain/entities/license-allocation.entity";

export interface UpdateLicenseAllocationRequest {
  id: string;
  allocatedQuantity?: number;
  note?: string | null;
}

@injectable()
export class UpdateLicenseAllocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAllocationRepository)
    private allocationRepository: ILicenseAllocationRepository,
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
    @inject(DI_TOKENS.IUnitOfWork)
    private unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    request: UpdateLicenseAllocationRequest,
  ): Promise<LicenseAllocation> {
    // Availability re-check and update run in one transaction with a row
    // lock on the entitlement (same locking discipline as create), so a
    // quantity increase cannot race other allocations past the seat limit.
    return this.unitOfWork.execute(async () => {
      // Find existing allocation
      const allocation = await this.allocationRepository.findById(request.id);
      if (!allocation) {
        throw new Error("License allocation not found");
      }

      const increasesConsumption =
        allocation.isActive() &&
        request.allocatedQuantity !== undefined &&
        request.allocatedQuantity > allocation.allocatedQuantity;

      if (increasesConsumption) {
        const entitlement = await this.entitlementRepository.findByIdForUpdate(
          allocation.licenseEntitlementId,
        );
        if (!entitlement) {
          throw new Error("License entitlement not found");
        }

        const consumedQuantity =
          await this.allocationRepository.sumActiveAllocatedQuantityByEntitlement(
            allocation.licenseEntitlementId,
          );
        const consumedAfterUpdate =
          consumedQuantity -
          allocation.allocatedQuantity +
          (request.allocatedQuantity as number);

        if (!entitlement.hasAvailableQuantity(consumedAfterUpdate)) {
          const available =
            entitlement.calculateAvailableQuantity(consumedQuantity) +
            allocation.allocatedQuantity;
          throw new Error(
            `Insufficient quantity available. Requested: ${request.allocatedQuantity}, Available: ${available}`,
          );
        }
      }

      // Update the allocation
      allocation.update({
        allocatedQuantity: request.allocatedQuantity,
        note: request.note,
      });

      return this.allocationRepository.update(allocation);
    });
  }
}
