/**
 * Vendor Contact Presenter
 * Transforms Vendor Contact domain entities into DTOs for the UI layer
 */

import type { VendorContact } from "@/core/domain/entities/vendor-contact.entity";

export interface VendorContactDTO {
  id: string;
  vendorId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  isActive: boolean;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentVendorContact(contact: VendorContact): VendorContactDTO {
  return {
    id: contact.id,
    vendorId: contact.vendorId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    title: contact.title,
    email: contact.email,
    phone: contact.phone,
    isPrimary: contact.isPrimary,
    isActive: contact.isActive,
    note: contact.note,
    metadata: contact.metadata,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export function presentVendorContacts(
  contacts: VendorContact[],
): VendorContactDTO[] {
  return contacts.map(presentVendorContact);
}
