/**
 * Delete Vendor Use Case
 *
 * Business logic for deleting a vendor.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";

@injectable()
export class DeleteVendorUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorRepository)
    private readonly vendorRepository: IVendorRepository,
  ) {}

  /**
   * Execute delete vendor use case
   *
   * @param id - Vendor ID to delete
   * @throws NotFoundError if vendor not found
   * @throws Error if vendor has related records
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const vendor = await this.vendorRepository.findById(id);
    if (!vendor) {
      throw new NotFoundError("Vendor not found", "Vendor", id);
    }

    // Check for vendor contacts
    // TODO: Implement hasContacts method in repository (use hasContracts or add new method)
    // const hasContacts = await this.vendorRepository.hasContacts(id);
    // if (hasContacts) {
    //   throw new Error(
    //     "Cannot delete vendor because it has associated contacts. Delete contacts first.",
    //   );
    // }

    // Check for configuration items
    // TODO: Implement hasConfigurationItems method in repository
    // const hasCIs = await this.vendorRepository.hasConfigurationItems(id);
    // if (hasCIs) {
    //   throw new Error(
    //     "Cannot delete vendor because it is referenced by configuration items",
    //   );
    // }

    // Check for assets
    const hasAssets = await this.vendorRepository.hasAssets(id);
    if (hasAssets) {
      throw new Error(
        "Cannot delete vendor because it is referenced by assets",
      );
    }

    await this.vendorRepository.delete(id);
  }
}
