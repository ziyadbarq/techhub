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
  legalName: string | null;
  description: string | null;
  vendorType: VendorType;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  isPreferred: boolean;
  isActive: boolean;
  tags: string[];
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentVendor(vendor: Vendor): VendorDTO {
  return {
    id: vendor.id,
    name: vendor.name,
    code: vendor.code,
    legalName: vendor.legalName,
    description: vendor.description,
    vendorType: vendor.vendorType,
    website: vendor.website,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address,
    city: vendor.city,
    state: vendor.state,
    country: vendor.country,
    postalCode: vendor.postalCode,
    taxId: vendor.taxId,
    paymentTerms: vendor.paymentTerms,
    isPreferred: vendor.isPreferred,
    isActive: vendor.isActive,
    tags: vendor.tags,
    note: vendor.note,
    metadata: vendor.metadata,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
  };
}

export function presentVendors(vendors: Vendor[]): VendorDTO[] {
  return vendors.map(presentVendor);
}
