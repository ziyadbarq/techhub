/**
 * Vendor Presenter
 * Transforms Vendor domain entities into DTOs for the UI layer
 */

import type { Vendor } from "@/core/domain/entities/vendor.entity";
import type { VendorType } from "@/core/domain/value-objects/foundation-enums";

export interface VendorDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  vendorType: VendorType;
  website: string | null;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  isActive: boolean;
  tags: string[];
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentVendor(vendor: Vendor): VendorDTO {
  return {
    id: vendor.id,
    name: vendor.name,
    code: vendor.code,
    description: vendor.description,
    vendorType: vendor.vendorType,
    website: vendor.website,
    email: vendor.email,
    phone: vendor.phone,
    taxId: vendor.taxId,
    paymentTerms: vendor.paymentTerms,
    isActive: vendor.isActive,
    tags: vendor.tags,
    metadata: vendor.metadata,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
  };
}

export function presentVendors(vendors: Vendor[]): VendorDTO[] {
  return vendors.map(presentVendor);
}
