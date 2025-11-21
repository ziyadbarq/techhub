/**
 * LicenseAllocation Entity
 * Represents a license allocation to a target (Person, CI, or Asset)
 * Uses polymorphic relationship pattern with targetType and targetId
 */

export enum AllocationTargetType {
  PERSON = "PERSON",
  CI = "CI",
  ASSET = "ASSET",
}

export interface CreateLicenseAllocationProps {
  licenseEntitlementId: string;
  targetType: AllocationTargetType;
  targetId: string;
  allocatedQuantity: number;
  note?: string | null;
}

export interface LicenseAllocationProps {
  id: string;
  licenseEntitlementId: string;
  targetType: AllocationTargetType;
  targetId: string;
  allocatedQuantity: number;
  allocatedAt: Date;
  deallocatedAt: Date | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateLicenseAllocationProps {
  allocatedQuantity?: number;
  note?: string | null;
}

export class LicenseAllocation {
  private constructor(private props: LicenseAllocationProps) {}

  // Factory method for creating new allocations
  static create(props: CreateLicenseAllocationProps): LicenseAllocation {
    // Validate required fields
    LicenseAllocation.validateLicenseEntitlementId(props.licenseEntitlementId);
    LicenseAllocation.validateTargetType(props.targetType);
    LicenseAllocation.validateTargetId(props.targetId);
    LicenseAllocation.validateAllocatedQuantity(props.allocatedQuantity);

    const now = new Date();

    return new LicenseAllocation({
      id: "", // Will be set by repository
      licenseEntitlementId: props.licenseEntitlementId,
      targetType: props.targetType,
      targetId: props.targetId,
      allocatedQuantity: props.allocatedQuantity,
      allocatedAt: now,
      deallocatedAt: null,
      note: props.note ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: LicenseAllocationProps): LicenseAllocation {
    return new LicenseAllocation(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get licenseEntitlementId(): string {
    return this.props.licenseEntitlementId;
  }

  get targetType(): AllocationTargetType {
    return this.props.targetType;
  }

  get targetId(): string {
    return this.props.targetId;
  }

  get allocatedQuantity(): number {
    return this.props.allocatedQuantity;
  }

  get allocatedAt(): Date {
    return this.props.allocatedAt;
  }

  get deallocatedAt(): Date | null {
    return this.props.deallocatedAt;
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
  public update(updates: UpdateLicenseAllocationProps): void {
    if (updates.allocatedQuantity !== undefined) {
      LicenseAllocation.validateAllocatedQuantity(updates.allocatedQuantity);
      this.props.allocatedQuantity = updates.allocatedQuantity;
    }

    if (updates.note !== undefined) {
      this.props.note = updates.note;
    }

    this.props.updatedAt = new Date();
  }

  public isActive(): boolean {
    return this.props.deallocatedAt === null;
  }

  public isDeallocated(): boolean {
    return this.props.deallocatedAt !== null;
  }

  public deallocate(deallocatedAt: Date = new Date()): void {
    if (this.props.deallocatedAt !== null) {
      throw new Error("This allocation is already deallocated");
    }

    if (!(deallocatedAt instanceof Date) || isNaN(deallocatedAt.getTime())) {
      throw new Error("Deallocation date must be a valid date");
    }

    if (deallocatedAt < this.props.allocatedAt) {
      throw new Error("Deallocation date cannot be before allocation date");
    }

    this.props.deallocatedAt = deallocatedAt;
    this.props.updatedAt = new Date();
  }

  public reactivate(): void {
    if (this.props.deallocatedAt === null) {
      throw new Error("This allocation is already active");
    }

    this.props.deallocatedAt = null;
    this.props.updatedAt = new Date();
  }

  public isAllocatedToPerson(): boolean {
    return this.props.targetType === AllocationTargetType.PERSON;
  }

  public isAllocatedToCI(): boolean {
    return this.props.targetType === AllocationTargetType.CI;
  }

  public isAllocatedToAsset(): boolean {
    return this.props.targetType === AllocationTargetType.ASSET;
  }

  // Validation methods
  private static validateLicenseEntitlementId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("License entitlement ID is required");
    }
  }

  private static validateTargetType(type: AllocationTargetType): void {
    if (!Object.values(AllocationTargetType).includes(type)) {
      throw new Error(
        `Invalid target type. Must be one of: ${Object.values(AllocationTargetType).join(", ")}`,
      );
    }
  }

  private static validateTargetId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Target ID is required");
    }
  }

  private static validateAllocatedQuantity(quantity: number): void {
    if (!Number.isInteger(quantity)) {
      throw new Error("Allocated quantity must be an integer");
    }
    if (quantity <= 0) {
      throw new Error("Allocated quantity must be greater than 0");
    }
  }

  // Equality
  public equals(other: LicenseAllocation): boolean {
    if (!(other instanceof LicenseAllocation)) {
      return false;
    }
    return this.props.id === other.props.id;
  }
}
