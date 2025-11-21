/**
 * Get Vendor Use Case
 *
 * Business logic for retrieving a single vendor by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { Vendor } from "@/core/domain/entities/vendor.entity";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";

@injectable()
export class GetVendorUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorRepository)
    private readonly vendorRepository: IVendorRepository,
  ) {}

  /**
   * Execute get vendor use case
   *
   * @param id - Vendor ID
   * @returns Vendor or null if not found
   */
  async execute(id: string): Promise<Vendor | null> {
    return await this.vendorRepository.findById(id);
  }
}
