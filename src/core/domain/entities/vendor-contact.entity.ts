/**
 * VendorContact Domain Entity
 * Contact persons for vendors
 */

export interface VendorContactProps {
  id: string;
  vendorId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  role: string | null; // Account manager, Support, Sales, etc.
  isPrimary: boolean;
  isActive: boolean;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

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

export class VendorContact {
  private constructor(private props: VendorContactProps) {}

  static create(props: CreateVendorContactProps): VendorContact {
    VendorContact.validateVendorId(props.vendorId);
    VendorContact.validateFirstName(props.firstName);
    VendorContact.validateLastName(props.lastName);
    if (props.email) VendorContact.validateEmail(props.email);
    if (props.phone) VendorContact.validatePhone(props.phone);
    if (props.mobile) VendorContact.validatePhone(props.mobile);

    const now = new Date();

    return new VendorContact({
      id: "",
      vendorId: props.vendorId,
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
      middleName: props.middleName?.trim() || null,
      title: props.title?.trim() || null,
      email: props.email?.trim().toLowerCase() || null,
      phone: props.phone?.trim() || null,
      mobile: props.mobile?.trim() || null,
      role: props.role?.trim() || null,
      isPrimary: props.isPrimary || false,
      isActive: true,
      note: props.note?.trim() || null,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: VendorContactProps): VendorContact {
    return new VendorContact(props);
  }

  update(props: {
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
  }): void {
    if (props.firstName !== undefined) {
      VendorContact.validateFirstName(props.firstName);
      this.props.firstName = props.firstName.trim();
    }

    if (props.lastName !== undefined) {
      VendorContact.validateLastName(props.lastName);
      this.props.lastName = props.lastName.trim();
    }

    if (props.middleName !== undefined) {
      this.props.middleName = props.middleName?.trim() || null;
    }

    if (props.title !== undefined) {
      this.props.title = props.title?.trim() || null;
    }

    if (props.email !== undefined) {
      if (props.email) VendorContact.validateEmail(props.email);
      this.props.email = props.email?.trim().toLowerCase() || null;
    }

    if (props.phone !== undefined) {
      if (props.phone) VendorContact.validatePhone(props.phone);
      this.props.phone = props.phone?.trim() || null;
    }

    if (props.mobile !== undefined) {
      if (props.mobile) VendorContact.validatePhone(props.mobile);
      this.props.mobile = props.mobile?.trim() || null;
    }

    if (props.role !== undefined) {
      this.props.role = props.role?.trim() || null;
    }

    if (props.isPrimary !== undefined) {
      this.props.isPrimary = props.isPrimary;
    }

    if (props.note !== undefined) {
      this.props.note = props.note?.trim() || null;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    this.props.updatedAt = new Date();
  }

  private static validateVendorId(vendorId: string): void {
    if (!vendorId || vendorId.trim().length === 0) {
      throw new Error("Vendor ID cannot be empty");
    }
  }

  private static validateFirstName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Contact first name cannot be empty");
    }
    if (name.trim().length < 2) {
      throw new Error("Contact first name must be at least 2 characters");
    }
    if (name.trim().length > 100) {
      throw new Error("Contact first name cannot exceed 100 characters");
    }
  }

  private static validateLastName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Contact last name cannot be empty");
    }
    if (name.trim().length < 2) {
      throw new Error("Contact last name must be at least 2 characters");
    }
    if (name.trim().length > 100) {
      throw new Error("Contact last name cannot exceed 100 characters");
    }
  }

  private static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error("Invalid email address format");
    }
  }

  private static validatePhone(phone: string): void {
    if (!/^[\d\s+\-()]+$/.test(phone.trim())) {
      throw new Error(
        "Phone number can only contain digits, spaces, +, -, (, )",
      );
    }
    const digitCount = phone.replace(/\D/g, "").length;
    if (digitCount < 7) {
      throw new Error("Phone number must contain at least 7 digits");
    }
  }

  hasContactInfo(): boolean {
    return !!(this.props.email || this.props.phone);
  }

  get id(): string {
    return this.props.id;
  }

  get vendorId(): string {
    return this.props.vendorId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get middleName(): string | null {
    return this.props.middleName;
  }

  get fullName(): string {
    return this.props.middleName
      ? `${this.props.firstName} ${this.props.middleName} ${this.props.lastName}`
      : `${this.props.firstName} ${this.props.lastName}`;
  }

  get title(): string | null {
    return this.props.title;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get mobile(): string | null {
    return this.props.mobile;
  }

  get role(): string | null {
    return this.props.role;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get isActive(): boolean {
    return this.props.isActive;
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

  setId(id: string): void {
    if (this.props.id)
      throw new Error("Cannot change contact ID after it has been set");
    this.props.id = id;
  }
  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  toObject(): VendorContactProps {
    return { ...this.props };
  }

  equals(other: VendorContact): boolean {
    return this.props.id === other.id;
  }
}
