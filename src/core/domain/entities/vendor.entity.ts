/**
 * Vendor Domain Entity
 * Supplier/manufacturer records for assets, contracts, and licenses
 */

import type { VendorType } from "@/core/domain/value-objects/foundation-enums";

export interface VendorProps {
  id: string;
  name: string;
  code: string;
  legalName: string | null;
  description: string | null;
  vendorType: VendorType;
  taxId: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  paymentTerms: string | null;
  isPreferred: boolean;
  isActive: boolean;
  tags: string[];
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

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

export class Vendor {
  private constructor(private props: VendorProps) {}

  /**
   * Factory method: Create a new vendor
   */
  static create(props: CreateVendorProps): Vendor {
    // Validation
    Vendor.validateName(props.name);
    Vendor.validateCode(props.code);
    if (props.email) Vendor.validateEmail(props.email);
    if (props.website) Vendor.validateWebsite(props.website);
    if (props.phone) Vendor.validatePhone(props.phone);

    const now = new Date();

    return new Vendor({
      id: "", // Will be set by repository
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      legalName: props.legalName?.trim() || null,
      description: props.description?.trim() || null,
      vendorType: props.vendorType,
      taxId: props.taxId?.trim() || null,
      website: props.website?.trim() || null,
      email: props.email?.trim().toLowerCase() || null,
      phone: props.phone?.trim() || null,
      address: props.address?.trim() || null,
      city: props.city?.trim() || null,
      state: props.state?.trim() || null,
      country: props.country?.trim() || null,
      postalCode: props.postalCode?.trim() || null,
      paymentTerms: props.paymentTerms?.trim() || null,
      isPreferred: props.isPreferred || false,
      isActive: true,
      tags: props.tags || [],
      note: props.note?.trim() || null,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: VendorProps): Vendor {
    return new Vendor(props);
  }

  /**
   * Update vendor details
   */
  update(props: {
    name?: string;
    code?: string;
    legalName?: string | null;
    description?: string | null;
    vendorType?: VendorType;
    taxId?: string | null;
    website?: string | null;
    phone?: string | null;
    email?: string | null;
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
  }): void {
    if (props.name !== undefined) {
      Vendor.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.code !== undefined) {
      Vendor.validateCode(props.code);
      this.props.code = props.code.trim().toUpperCase();
    }

    if (props.email !== undefined) {
      if (props.email) Vendor.validateEmail(props.email);
      this.props.email = props.email?.trim().toLowerCase() || null;
    }

    if (props.website !== undefined) {
      if (props.website) Vendor.validateWebsite(props.website);
      this.props.website = props.website?.trim() || null;
    }

    if (props.phone !== undefined) {
      if (props.phone) Vendor.validatePhone(props.phone);
      this.props.phone = props.phone?.trim() || null;
    }

    if (props.legalName !== undefined) {
      this.props.legalName = props.legalName?.trim() || null;
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.vendorType !== undefined) {
      this.props.vendorType = props.vendorType;
    }

    if (props.taxId !== undefined) {
      this.props.taxId = props.taxId?.trim() || null;
    }

    if (props.address !== undefined) {
      this.props.address = props.address?.trim() || null;
    }

    if (props.city !== undefined) {
      this.props.city = props.city?.trim() || null;
    }

    if (props.state !== undefined) {
      this.props.state = props.state?.trim() || null;
    }

    if (props.country !== undefined) {
      this.props.country = props.country?.trim() || null;
    }

    if (props.postalCode !== undefined) {
      this.props.postalCode = props.postalCode?.trim() || null;
    }

    if (props.paymentTerms !== undefined) {
      this.props.paymentTerms = props.paymentTerms?.trim() || null;
    }

    if (props.isPreferred !== undefined) {
      this.props.isPreferred = props.isPreferred;
    }

    if (props.tags !== undefined) {
      this.props.tags = props.tags;
    }

    if (props.note !== undefined) {
      this.props.note = props.note?.trim() || null;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    this.props.updatedAt = new Date();
  }

  // Business Rules & Validation

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Vendor name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Vendor name must be at least 2 characters");
    }

    if (name.trim().length > 200) {
      throw new Error("Vendor name cannot exceed 200 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Vendor code cannot be empty");
    }

    if (code.trim().length < 2) {
      throw new Error("Vendor code must be at least 2 characters");
    }

    if (code.trim().length > 50) {
      throw new Error("Vendor code cannot exceed 50 characters");
    }

    // Must be alphanumeric, hyphens, underscores
    if (!/^[A-Z0-9\-_]+$/i.test(code.trim())) {
      throw new Error(
        "Vendor code can only contain letters, numbers, hyphens, and underscores",
      );
    }
  }

  private static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error("Invalid email address format");
    }

    if (email.trim().length > 255) {
      throw new Error("Email address cannot exceed 255 characters");
    }
  }

  private static validateWebsite(website: string): void {
    try {
      const url = new URL(website.trim());
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Website must use HTTP or HTTPS protocol");
      }
    } catch {
      throw new Error("Invalid website URL format");
    }

    if (website.trim().length > 500) {
      throw new Error("Website URL cannot exceed 500 characters");
    }
  }

  private static validatePhone(phone: string): void {
    // Basic phone validation: allow digits, spaces, +, -, (, )
    if (!/^[\d\s+\-()]+$/.test(phone.trim())) {
      throw new Error(
        "Phone number can only contain digits, spaces, +, -, (, )",
      );
    }

    if (phone.trim().length > 50) {
      throw new Error("Phone number cannot exceed 50 characters");
    }

    // Require at least 7 digits
    const digitCount = phone.replace(/\D/g, "").length;
    if (digitCount < 7) {
      throw new Error("Phone number must contain at least 7 digits");
    }
  }

  /**
   * Check if vendor has complete information
   */
  isComplete(): boolean {
    return !!(
      this.props.name &&
      this.props.legalName &&
      (this.props.email || this.props.phone)
    );
  }

  /**
   * Check if this vendor can be deleted
   * (Business rule: Cannot delete if has assets, contracts, or licenses)
   */
  canBeDeleted(
    hasAssets: boolean,
    hasContracts: boolean,
    hasLicenses: boolean,
  ): boolean {
    return !hasAssets && !hasContracts && !hasLicenses;
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get legalName(): string | null {
    return this.props.legalName;
  }

  get description(): string | null {
    return this.props.description;
  }

  get vendorType(): VendorType {
    return this.props.vendorType;
  }

  get taxId(): string | null {
    return this.props.taxId;
  }

  get website(): string | null {
    return this.props.website;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get address(): string | null {
    return this.props.address;
  }

  get city(): string | null {
    return this.props.city;
  }

  get state(): string | null {
    return this.props.state;
  }

  get country(): string | null {
    return this.props.country;
  }

  get postalCode(): string | null {
    return this.props.postalCode;
  }

  get paymentTerms(): string | null {
    return this.props.paymentTerms;
  }

  get isPreferred(): boolean {
    return this.props.isPreferred;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get note(): string | null {
    return this.props.note;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Internal setters (for repository use)

  setId(id: string): void {
    if (this.props.id) {
      throw new Error("Cannot change vendor ID after it has been set");
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): VendorProps {
    return { ...this.props };
  }

  /**
   * Compare with another vendor
   */
  equals(other: Vendor): boolean {
    return this.props.id === other.id;
  }
}
