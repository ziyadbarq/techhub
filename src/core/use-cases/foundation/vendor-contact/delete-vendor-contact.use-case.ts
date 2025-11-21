/**
 * Delete Vendor Contact Use Case
 *
 * Business logic for deleting a vendor contact.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { IVendorContactRepository } from "@/core/repositories/vendor-contact.repository.interface";

@injectable()
export class DeleteVendorContactUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorContactRepository)
    private readonly vendorContactRepository: IVendorContactRepository,
  ) {}

  /**
   * Execute delete vendor contact use case
   *
   * @param id - Vendor contact ID to delete
   * @throws NotFoundError if vendor contact not found
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const vendorContact = await this.vendorContactRepository.findById(id);
    if (!vendorContact) {
      throw new NotFoundError("Vendor contact not found", "VendorContact", id);
    }

    await this.vendorContactRepository.delete(id);
  }
}
