/**
 * Get LicenseAllocation Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { LicenseAllocation } from "@/core/domain/entities/license-allocation.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetLicenseAllocationRequest {
  id: string;
}

@injectable()
export class GetLicenseAllocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAllocationRepository)
    private allocationRepository: ILicenseAllocationRepository,
  ) {}

  async execute(
    request: GetLicenseAllocationRequest,
  ): Promise<LicenseAllocation> {
    const allocation = await this.allocationRepository.findById(request.id);

    if (!allocation) {
      throw new NotFoundError("License allocation not found");
    }

    return allocation;
  }
}
