/**
 * Deallocate LicenseAllocation Use Case
 * Marks an allocation as deallocated without deleting it (soft deactivation)
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { LicenseAllocation } from "@/core/domain/entities/license-allocation.entity";

export interface DeallocateLicenseAllocationRequest {
  id: string;
  deallocatedAt?: Date;
}

@injectable()
export class DeallocateLicenseAllocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAllocationRepository)
    private allocationRepository: ILicenseAllocationRepository,
  ) {}

  async execute(
    request: DeallocateLicenseAllocationRequest,
  ): Promise<LicenseAllocation> {
    // Find existing allocation
    const allocation = await this.allocationRepository.findById(request.id);
    if (!allocation) {
      throw new Error("License allocation not found");
    }

    // Deallocate
    allocation.deallocate(request.deallocatedAt);

    return await this.allocationRepository.update(allocation);
  }
}
