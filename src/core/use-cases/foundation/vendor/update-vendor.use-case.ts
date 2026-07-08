/**
 * Update Vendor Use Case
 *
 * Business logic for updating an existing vendor.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { Vendor } from "@/core/domain/entities/vendor.entity";
import type { VendorType } from "@/core/domain/value-objects/foundation-enums";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";

export interface UpdateVendorProps {
  id: string;
  name?: string;
  code?: string;
  legalName?: string | null;
  description?: string | null;
  vendorType?: VendorType;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  isPreferred?: boolean;
  tags?: string[];
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdateVendorUseCase {
  constructor(
    @inject(DI_TOKENS.IVendorRepository)
    private readonly vendorRepository: IVendorRepository,
  ) {}

  /**
   * Execute update vendor use case
   *
   * @param props - Update properties
   * @returns Updated vendor
   * @throws NotFoundError if vendor not found
   * @throws Error if name already exists
   */
  async execute(props: UpdateVendorProps): Promise<Vendor> {
    // Fetch existing vendor
    const vendor = await this.vendorRepository.findById(props.id);
    if (!vendor) {
      throw new NotFoundError("Vendor not found", "Vendor", props.id);
    }

    // Check for duplicate code if changing
    // TODO: Implement findByCode method in repository
    // if (props.code !== undefined && props.code !== vendor.code) {
    //   const existingVendor = await this.vendorRepository.findByCode(props.code);
    //   if (existingVendor) {
    //     throw new ConflictError(`Vendor with code "${props.code}" already exists`);
    //   }
    // }

    // Update using entity's update method (includes validation)
    vendor.update({
      name: props.name,
      code: props.code,
      legalName: props.legalName,
      description: props.description,
      vendorType: props.vendorType,
      taxId: props.taxId,
      website: props.website,
      email: props.email,
      phone: props.phone,
      address: props.address,
      city: props.city,
      state: props.state,
      country: props.country,
      postalCode: props.postalCode,
      paymentTerms: props.paymentTerms,
      isPreferred: props.isPreferred,
      tags: props.tags,
      note: props.note,
      metadata: props.metadata,
    });

    // Persist changes
    return await this.vendorRepository.update(vendor);
  }
}
