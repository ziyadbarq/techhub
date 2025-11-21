/**
 * Reactivate LicenseAllocation Use Case
 * Reactivates a previously deallocated allocation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { LicenseAllocation } from "@/core/domain/entities/license-allocation.entity";

export interface ReactivateLicenseAllocationRequest {
  id: string;
}

@injectable()
export class ReactivateLicenseAllocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAllocationRepository)
    private allocationRepository: ILicenseAllocationRepository,
  ) {}

  async execute(
    request: ReactivateLicenseAllocationRequest,
  ): Promise<LicenseAllocation> {
    // Find existing allocation
    const allocation = await this.allocationRepository.findById(request.id);
    if (!allocation) {
      throw new Error("License allocation not found");
    }

    // Reactivate
    allocation.reactivate();

    return await this.allocationRepository.update(allocation);
  }
}
