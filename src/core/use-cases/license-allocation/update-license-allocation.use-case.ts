/**
 * Update LicenseAllocation Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
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
  ) {}

  async execute(
    request: UpdateLicenseAllocationRequest,
  ): Promise<LicenseAllocation> {
    // Find existing allocation
    const allocation = await this.allocationRepository.findById(request.id);
    if (!allocation) {
      throw new Error("License allocation not found");
    }

    // Update the allocation
    allocation.update({
      allocatedQuantity: request.allocatedQuantity,
      note: request.note,
    });

    return await this.allocationRepository.update(allocation);
  }
}
