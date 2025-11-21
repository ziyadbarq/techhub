/**
 * Create Vendor Contact Use Case
 *
 * Business logic for creating a new vendor contact.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { VendorContact } from "@/core/domain/entities/vendor-contact.entity";
import type { IVendorContactRepository } from "@/core/repositories/vendor-contact.repository.interface";

export interface CreateVendorContactProps {
  vendorId: string;
  firstName: string;
  lastName: string;
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
export class CreateVendorContactUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorContactRepository)
    private readonly vendorContactRepository: IVendorContactRepository,
  ) {}

  /**
   * Execute create vendor contact use case
   *
   * @param props - Vendor contact creation properties
   * @returns Created vendor contact
   */
  async execute(props: CreateVendorContactProps): Promise<VendorContact> {
    const vendorContact = VendorContact.create(props);
    const created = await this.vendorContactRepository.create(vendorContact);
    return created;
  }
}
