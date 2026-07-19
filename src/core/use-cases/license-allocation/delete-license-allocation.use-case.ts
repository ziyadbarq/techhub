/**
 * Delete LicenseAllocation Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteLicenseAllocationRequest {
  id: string;
}

@injectable()
export class DeleteLicenseAllocationUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAllocationRepository)
    private allocationRepository: ILicenseAllocationRepository,
  ) {}

  async execute(request: DeleteLicenseAllocationRequest): Promise<void> {
    // Check if allocation exists
    const exists = await this.allocationRepository.exists(request.id);
    if (!exists) {
      throw new NotFoundError("License allocation not found");
    }

    await this.allocationRepository.delete(request.id);
  }
}
