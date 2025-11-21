/**
 * Get Vendor Contact Use Case
 *
 * Business logic for retrieving a single vendor contact by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { VendorContact } from "@/core/domain/entities/vendor-contact.entity";
import type { IVendorContactRepository } from "@/core/repositories/vendor-contact.repository.interface";

@injectable()
export class GetVendorContactUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorContactRepository)
    private readonly vendorContactRepository: IVendorContactRepository,
  ) {}

  /**
   * Execute get vendor contact use case
   *
   * @param id - Vendor contact ID
   * @returns Vendor contact or null if not found
   */
  async execute(id: string): Promise<VendorContact | null> {
    return await this.vendorContactRepository.findById(id);
  }
}
