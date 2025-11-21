/**
 * Create Vendor Use Case
 *
 * Business logic for creating a new vendor.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { Vendor } from "@/core/domain/entities/vendor.entity";
import type { VendorType } from "@/core/domain/value-objects/foundation-enums";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";

export interface CreateVendorProps {
  name: string;
  code: string;
  legalName?: string | null;
  description?: string | null;
  vendorType: VendorType;
  taxId?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  paymentTerms?: string | null;
  isPreferred?: boolean;
  tags?: string[];
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class CreateVendorUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorRepository)
    private readonly vendorRepository: IVendorRepository,
  ) {}

  /**
   * Execute create vendor use case
   *
   * @param props - Vendor creation properties
   * @returns Created vendor
   * @throws Error if name already exists
   */
  async execute(props: CreateVendorProps): Promise<Vendor> {
    // Check for duplicate name
    const existingVendor = await this.vendorRepository.findByName(props.name);
    if (existingVendor) {
      throw new Error(`Vendor with name "${props.name}" already exists`);
    }

    const vendor = Vendor.create(props);
    const created = await this.vendorRepository.create(vendor);
    return created;
  }
}
