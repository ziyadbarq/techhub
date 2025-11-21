/**
 * IVendorContactRepository Interface
 * Data access contract for vendor contacts
 */

import type { VendorContact } from "../domain/entities/vendor-contact.entity";

export interface IVendorContactRepository {
  /**
   * Create a new vendor contact
   */
  create(contact: VendorContact): Promise<VendorContact>;

  /**
   * Find vendor contact by ID
   */
  findById(id: string): Promise<VendorContact | null>;

  /**
   * Find all contacts for a vendor
   */
  findByVendorId(vendorId: string): Promise<VendorContact[]>;

  /**
   * Find contact by email
   */
  findByEmail(email: string): Promise<VendorContact[]>;

  /**
   * Find contacts by role
   */
  findByRole(vendorId: string, role: string): Promise<VendorContact[]>;

  /**
   * Find all vendor contacts
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "fullName" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<VendorContact[]>;

  /**
   * Search vendor contacts by name
   */
  search(vendorId: string, query: string): Promise<VendorContact[]>;

  /**
   * Count contacts for a vendor
   */
  countByVendorId(vendorId: string): Promise<number>;

  /**
   * Update vendor contact
   */
  update(contact: VendorContact): Promise<VendorContact>;

  /**
   * Delete vendor contact
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all contacts for a vendor
   */
  deleteByVendorId(vendorId: string): Promise<void>;
}
