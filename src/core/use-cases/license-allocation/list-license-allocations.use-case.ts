/**
 * List LicenseAllocations Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type {
  LicenseAllocation,
  AllocationTargetType,
} from "@/core/domain/entities/license-allocation.entity";

export interface ListLicenseAllocationsRequest {
  licenseEntitlementId?: string;
  targetType?: AllocationTargetType;
  targetId?: string;
  activeOnly?: boolean;
}

@injectable()
export class ListLicenseAllocationsUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAllocationRepository)
    private allocationRepository: ILicenseAllocationRepository,
  ) {}

  async execute(
    request: ListLicenseAllocationsRequest = {},
  ): Promise<LicenseAllocation[]> {
    // Filter by target if both targetType and targetId are specified
    if (request.targetType && request.targetId) {
      if (request.activeOnly) {
        return await this.allocationRepository.findActiveByTarget(
          request.targetType,
          request.targetId,
        );
      }
      return await this.allocationRepository.findByTarget(
        request.targetType,
        request.targetId,
      );
    }

    // Filter by license entitlement if specified
    if (request.licenseEntitlementId) {
      if (request.activeOnly) {
        return await this.allocationRepository.findActiveByLicenseEntitlementId(
          request.licenseEntitlementId,
        );
      }
      return await this.allocationRepository.findByLicenseEntitlementId(
        request.licenseEntitlementId,
      );
    }

    // Return all allocations
    return await this.allocationRepository.findAll();
  }
}
