/**
 * List Vendor Contacts Use Case
 *
 * Business logic for listing vendor contacts with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { VendorContact } from "@/core/domain/entities/vendor-contact.entity";
import type { IVendorContactRepository } from "@/core/repositories/vendor-contact.repository.interface";

export interface ListVendorContactsOptions {
  skip?: number;
  take?: number;
  orderBy?: "fullName" | "createdAt";
  order?: "asc" | "desc";
  vendorId?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

@injectable()
export class ListVendorContactsUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorContactRepository)
    private readonly vendorContactRepository: IVendorContactRepository,
  ) {}

  /**
   * Execute list vendor contacts use case
   *
   * @param options - Optional filter options
   * @returns Array of vendor contacts
   */
  async execute(options?: ListVendorContactsOptions): Promise<VendorContact[]> {
    if (options?.vendorId) {
      return await this.vendorContactRepository.findByVendorId(
        options.vendorId,
      );
    }

    // TODO: Implement findPrimaryContacts and findActive methods in repository
    // if (options?.isPrimary !== undefined) {
    //   return await this.vendorContactRepository.findPrimaryContacts();
    // }

    // if (options?.isActive !== undefined) {
    //   return await this.vendorContactRepository.findActive(options.isActive);
    // }

    return await this.vendorContactRepository.findAll(options);
  }
}
