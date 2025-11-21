/**
 * Update Vendor Contact Use Case
 *
 * Business logic for updating an existing vendor contact.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { VendorContact } from "@/core/domain/entities/vendor-contact.entity";
import type { IVendorContactRepository } from "@/core/repositories/vendor-contact.repository.interface";

export interface UpdateVendorContactProps {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  role?: string | null;
  isPrimary?: boolean;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdateVendorContactUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorContactRepository)
    private readonly vendorContactRepository: IVendorContactRepository,
  ) {}

  /**
   * Execute update vendor contact use case
   *
   * @param props - Update properties
   * @returns Updated vendor contact
   * @throws NotFoundError if vendor contact not found
   */
  async execute(props: UpdateVendorContactProps): Promise<VendorContact> {
    // Fetch existing vendor contact
    const vendorContact = await this.vendorContactRepository.findById(props.id);
    if (!vendorContact) {
      throw new NotFoundError(
        "Vendor contact not found",
        "VendorContact",
        props.id,
      );
    }

    // Update using entity's update method (includes validation)
    vendorContact.update({
      firstName: props.firstName,
      lastName: props.lastName,
      middleName: props.middleName,
      title: props.title,
      email: props.email,
      phone: props.phone,
      mobile: props.mobile,
      role: props.role,
      isPrimary: props.isPrimary,
      note: props.note,
      metadata: props.metadata,
    });

    // Persist changes
    return await this.vendorContactRepository.update(vendorContact);
  }
}
