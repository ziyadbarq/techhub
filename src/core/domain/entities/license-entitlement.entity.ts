/**
 * LicenseEntitlement Entity
 * Represents a license entitlement granted to the organization
 */

export interface CreateLicenseEntitlementProps {
  licenseProductId: string;
  contractId?: string | null;
  purchasedQuantity: number;
  effectiveStart: Date;
  effectiveEnd?: Date | null;
  allowedScope?: Record<string, unknown> | null;
  note?: string | null;
}

export interface LicenseEntitlementProps {
  id: string;
  licenseProductId: string;
  contractId: string | null;
  purchasedQuantity: number;
  effectiveStart: Date;
  effectiveEnd: Date | null;
  allowedScope: Record<string, unknown> | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateLicenseEntitlementProps {
  purchasedQuantity?: number;
  effectiveStart?: Date;
  effectiveEnd?: Date | null;
  allowedScope?: Record<string, unknown> | null;
  note?: string | null;
}

export class LicenseEntitlement {
  private constructor(private props: LicenseEntitlementProps) {}

  // Factory method for creating new entitlements
  static create(props: CreateLicenseEntitlementProps): LicenseEntitlement {
    // Validate required fields
    LicenseEntitlement.validateLicenseProductId(props.licenseProductId);
    LicenseEntitlement.validatePurchasedQuantity(props.purchasedQuantity);
    LicenseEntitlement.validateEffectiveDates(
      props.effectiveStart,
      props.effectiveEnd ?? null,
    );

    if (props.contractId) {
      LicenseEntitlement.validateContractId(props.contractId);
    }

    const now = new Date();

    return new LicenseEntitlement({
      id: "", // Will be set by repository
      licenseProductId: props.licenseProductId,
      contractId: props.contractId ?? null,
      purchasedQuantity: props.purchasedQuantity,
      effectiveStart: props.effectiveStart,
      effectiveEnd: props.effectiveEnd ?? null,
      allowedScope: props.allowedScope ?? null,
      note: props.note ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: LicenseEntitlementProps): LicenseEntitlement {
    return new LicenseEntitlement(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get licenseProductId(): string {
    return this.props.licenseProductId;
  }

  get contractId(): string | null {
    return this.props.contractId;
  }

  get purchasedQuantity(): number {
    return this.props.purchasedQuantity;
  }

  get effectiveStart(): Date {
    return this.props.effectiveStart;
  }

  get effectiveEnd(): Date | null {
    return this.props.effectiveEnd;
  }

  get allowedScope(): Record<string, unknown> | null {
    return this.props.allowedScope;
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
  public update(updates: UpdateLicenseEntitlementProps): void {
    if (updates.purchasedQuantity !== undefined) {
      LicenseEntitlement.validatePurchasedQuantity(updates.purchasedQuantity);
      this.props.purchasedQuantity = updates.purchasedQuantity;
    }

    if (updates.effectiveStart !== undefined) {
      const newEnd =
        updates.effectiveEnd !== undefined
          ? updates.effectiveEnd
          : this.props.effectiveEnd;
      LicenseEntitlement.validateEffectiveDates(updates.effectiveStart, newEnd);
      this.props.effectiveStart = updates.effectiveStart;
    }

    if (updates.effectiveEnd !== undefined) {
      LicenseEntitlement.validateEffectiveDates(
        this.props.effectiveStart,
        updates.effectiveEnd,
      );
      this.props.effectiveEnd = updates.effectiveEnd;
    }

    if (updates.allowedScope !== undefined) {
      this.props.allowedScope = updates.allowedScope;
    }

    if (updates.note !== undefined) {
      this.props.note = updates.note;
    }

    this.props.updatedAt = new Date();
  }

  public isActive(asOfDate: Date = new Date()): boolean {
    const startValid = asOfDate >= this.props.effectiveStart;
    const endValid =
      this.props.effectiveEnd === null || asOfDate <= this.props.effectiveEnd;
    return startValid && endValid;
  }

  public isExpired(asOfDate: Date = new Date()): boolean {
    if (this.props.effectiveEnd === null) {
      return false; // No end date means it never expires
    }
    return asOfDate > this.props.effectiveEnd;
  }

  public calculateAvailableQuantity(consumedQuantity: number): number {
    return this.props.purchasedQuantity - consumedQuantity;
  }

  public hasAvailableQuantity(consumedQuantity: number): boolean {
    return this.calculateAvailableQuantity(consumedQuantity) > 0;
  }

  public linkToContract(contractId: string): void {
    LicenseEntitlement.validateContractId(contractId);
    this.props.contractId = contractId;
    this.props.updatedAt = new Date();
  }

  public unlinkFromContract(): void {
    this.props.contractId = null;
    this.props.updatedAt = new Date();
  }

  public setAllowedScope(scope: Record<string, unknown> | null): void {
    this.props.allowedScope = scope;
    this.props.updatedAt = new Date();
  }

  // Validation methods
  private static validateLicenseProductId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("License product ID is required");
    }
  }

  private static validateContractId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Contract ID cannot be empty");
    }
  }

  private static validatePurchasedQuantity(quantity: number): void {
    if (!Number.isInteger(quantity)) {
      throw new Error("Purchased quantity must be an integer");
    }
    if (quantity <= 0) {
      throw new Error("Purchased quantity must be greater than 0");
    }
  }

  private static validateEffectiveDates(start: Date, end: Date | null): void {
    if (!(start instanceof Date) || isNaN(start.getTime())) {
      throw new Error(
        "Effective start date is required and must be a valid date",
      );
    }

    if (end !== null) {
      if (!(end instanceof Date) || isNaN(end.getTime())) {
        throw new Error("Effective end date must be a valid date");
      }

      if (end <= start) {
        throw new Error(
          "Effective end date must be after effective start date",
        );
      }
    }
  }

  // Equality
  public equals(other: LicenseEntitlement): boolean {
    if (!(other instanceof LicenseEntitlement)) {
      return false;
    }
    return this.props.id === other.props.id;
  }
}
