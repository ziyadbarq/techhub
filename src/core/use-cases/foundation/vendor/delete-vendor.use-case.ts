/**
 * Delete Vendor Use Case
 *
 * Business logic for deleting a vendor.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
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

    // Referential guards: block deletion while dependent records exist so
    // callers get a clear message instead of a raw FK-constraint error.
    const [hasContacts, hasAssets, hasContracts, hasLicenseProducts] =
      await Promise.all([
        this.vendorRepository.hasContacts(id),
        this.vendorRepository.hasAssets(id),
        this.vendorRepository.hasContracts(id),
        this.vendorRepository.hasLicenseProducts(id),
      ]);

    if (hasContacts) {
      throw new ValidationError(
        "Cannot delete vendor because it has associated contacts. Delete contacts first.",
      );
    }

    if (hasAssets) {
      throw new ValidationError(
        "Cannot delete vendor because it is referenced by assets",
      );
    }

    if (hasContracts) {
      throw new ValidationError(
        "Cannot delete vendor because it is referenced by contracts",
      );
    }

    if (hasLicenseProducts) {
      throw new ValidationError(
        "Cannot delete vendor because it is referenced by license products",
      );
    }

    await this.vendorRepository.delete(id);
  }
}
