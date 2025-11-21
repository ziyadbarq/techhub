/**
 * Create LicenseAllocation Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { AllocationTargetType } from "@/core/domain/entities/license-allocation.entity";
import { LicenseAllocation } from "@/core/domain/entities/license-allocation.entity";

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
  ) {}

  async execute(
    request: CreateLicenseAllocationRequest,
  ): Promise<LicenseAllocation> {
    // Validate license entitlement exists
    const entitlement = await this.entitlementRepository.findById(
      request.licenseEntitlementId,
    );
    if (!entitlement) {
      throw new Error("License entitlement not found");
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

    return await this.allocationRepository.create(allocation);
  }
}
