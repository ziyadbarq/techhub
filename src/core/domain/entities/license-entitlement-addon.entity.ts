/**
 * LicenseEntitlementAddon Entity
 * Represents the attachment of a license addon to a specific entitlement,
 * including the cost for that addon on that entitlement
 */

export interface CreateLicenseEntitlementAddonProps {
  licenseEntitlementId: string;
  licenseAddonId: string;
  cost?: number | null;
  currency?: string | null;
  note?: string | null;
}

export interface LicenseEntitlementAddonProps {
  id: string;
  licenseEntitlementId: string;
  licenseAddonId: string;
  cost: number | null;
  currency: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateLicenseEntitlementAddonProps {
  cost?: number | null;
  currency?: string | null;
  note?: string | null;
}

export class LicenseEntitlementAddon {
  private constructor(private props: LicenseEntitlementAddonProps) {}

  // Factory method for creating new entitlement addons
  static create(
    props: CreateLicenseEntitlementAddonProps,
  ): LicenseEntitlementAddon {
    // Validate required fields
    LicenseEntitlementAddon.validateEntitlementId(props.licenseEntitlementId);
    LicenseEntitlementAddon.validateAddonId(props.licenseAddonId);

    // Validate cost fields if provided
    if (props.cost !== undefined && props.cost !== null) {
      LicenseEntitlementAddon.validateCostValue(props.cost, "Cost");
    }
    if (props.currency !== undefined && props.currency !== null) {
      LicenseEntitlementAddon.validateCurrency(props.currency);
    }

    const now = new Date();

    return new LicenseEntitlementAddon({
      id: "", // Will be set by repository
      licenseEntitlementId: props.licenseEntitlementId,
      licenseAddonId: props.licenseAddonId,
      cost: props.cost ?? null,
      currency: props.currency ?? null,
      note: props.note?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(
    props: LicenseEntitlementAddonProps,
  ): LicenseEntitlementAddon {
    return new LicenseEntitlementAddon(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get licenseEntitlementId(): string {
    return this.props.licenseEntitlementId;
  }

  get licenseAddonId(): string {
    return this.props.licenseAddonId;
  }

  get cost(): number | null {
    return this.props.cost;
  }

  get currency(): string | null {
    return this.props.currency;
  }

  get note(): string | null {
    return this.props.note;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  public update(updates: UpdateLicenseEntitlementAddonProps): void {
    if (updates.cost !== undefined) {
      if (updates.cost !== null) {
        LicenseEntitlementAddon.validateCostValue(updates.cost, "Cost");
      }
      this.props.cost = updates.cost;
    }

    if (updates.currency !== undefined) {
      if (updates.currency !== null) {
        LicenseEntitlementAddon.validateCurrency(updates.currency);
      }
      this.props.currency = updates.currency;
    }

    if (updates.note !== undefined) {
      this.props.note = updates.note?.trim() ?? null;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Check if cost is set for this addon attachment
   */
  public hasCost(): boolean {
    return this.props.cost !== null;
  }

  // Validation methods
  private static validateEntitlementId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("License entitlement ID is required");
    }
  }

  private static validateAddonId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("License addon ID is required");
    }
  }

  private static validateCostValue(value: number, fieldName: string): void {
    if (value < 0) {
      throw new Error(`${fieldName} must be non-negative`);
    }
    if (!Number.isFinite(value)) {
      throw new Error(`${fieldName} must be a valid number`);
    }
    // Validate decimal precision (12,2)
    const parts = value.toString().split(".");
    if (parts[0] && parts[0].length > 10) {
      throw new Error(`${fieldName} exceeds maximum precision`);
    }
    if (parts[1] && parts[1].length > 2) {
      throw new Error(`${fieldName} can have at most 2 decimal places`);
    }
  }

  private static validateCurrency(currency: string): void {
    if (currency.length !== 3) {
      throw new Error("Currency must be a 3-letter ISO code");
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error(
        "Currency must be 3 uppercase letters (e.g., USD, EUR, SAR)",
      );
    }
  }

  // Equality
  public equals(other: LicenseEntitlementAddon): boolean {
    if (!(other instanceof LicenseEntitlementAddon)) {
      return false;
    }
    return this.props.id === other.props.id;
  }
}
