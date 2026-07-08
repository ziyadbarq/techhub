/**
 * Create LicenseAllocation Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { IUnitOfWork } from "@/core/services/unit-of-work.service.interface";
import type { AllocationTargetType } from "@/core/domain/entities/license-allocation.entity";
import { LicenseAllocation } from "@/core/domain/entities/license-allocation.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CreateLicenseAllocationRequest {
  licenseEntitlementId: string;
  targetType: AllocationTargetType;
  targetId: string;
  allocatedQuantity: number;
  note?: string | null;
}

@injectable()
export class CreateLicenseAllocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAllocationRepository)
    private allocationRepository: ILicenseAllocationRepository,
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
    @inject(DI_TOKENS.IUnitOfWork)
    private unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    request: CreateLicenseAllocationRequest,
  ): Promise<LicenseAllocation> {
    // The seat-availability check and the allocation insert run in one
    // transaction, with a row lock on the entitlement so two concurrent
    // allocations cannot both pass the check and over-allocate.
    return this.unitOfWork.execute(async () => {
      // Validate license entitlement exists (locks the entitlement row)
      const entitlement = await this.entitlementRepository.findByIdForUpdate(
        request.licenseEntitlementId,
      );
      if (!entitlement) {
        throw new NotFoundError("License entitlement not found");
      }

      // Check if entitlement is active
      if (!entitlement.isActive()) {
        throw new Error("Cannot allocate from an inactive entitlement");
      }

      // Check if there's enough quantity available
      const consumedQuantity =
        await this.allocationRepository.sumActiveAllocatedQuantityByEntitlement(
          request.licenseEntitlementId,
        );

      if (
        !entitlement.hasAvailableQuantity(
          consumedQuantity + request.allocatedQuantity,
        )
      ) {
        const available =
          entitlement.calculateAvailableQuantity(consumedQuantity);
        throw new Error(
          `Insufficient quantity available. Requested: ${request.allocatedQuantity}, Available: ${available}`,
        );
      }

      // Create the allocation
      const allocation = LicenseAllocation.create({
        licenseEntitlementId: request.licenseEntitlementId,
        targetType: request.targetType,
        targetId: request.targetId,
        allocatedQuantity: request.allocatedQuantity,
        note: request.note,
      });

      return this.allocationRepository.create(allocation);
    });
  }
}
