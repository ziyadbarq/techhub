/**
 * CIRelationship Entity
 *
 * Represents a relationship between two Configuration Items (CIs).
 * Supports both unidirectional and bidirectional relationships with temporal validity.
 */

export interface CIRelationshipProps {
  id: string;
  fromCiId: string;
  toCiId: string;
  relationshipTypeId: string;
  isActive: boolean;
  validFrom: Date;
  validTo: Date | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCIRelationshipProps {
  fromCiId: string;
  toCiId: string;
  relationshipTypeId: string;
  validFrom?: Date;
  validTo?: Date | null;
  note?: string | null;
}

export interface UpdateCIRelationshipProps {
  validTo?: Date | null;
  note?: string | null;
  isActive?: boolean;
}

export class CIRelationship {
  private constructor(private props: CIRelationshipProps) {
    this.validate();
  }

  /**
   * Factory method to create a new CI relationship
   */
  static create(props: CreateCIRelationshipProps): CIRelationship {
    // Validation
    if (!props.fromCiId?.trim()) {
      throw new Error("From CI ID is required");
    }
    if (!props.toCiId?.trim()) {
      throw new Error("To CI ID is required");
    }
    if (!props.relationshipTypeId?.trim()) {
      throw new Error("Relationship Type ID is required");
    }
    if (props.fromCiId === props.toCiId) {
      throw new Error("Cannot create relationship from CI to itself");
    }

    const now = new Date();
    const validFrom = props.validFrom || now;

    // Validate date range if validTo is provided
    if (props.validTo && props.validTo <= validFrom) {
      throw new Error("Valid to date must be after valid from date");
    }

    return new CIRelationship({
      id: crypto.randomUUID(),
      fromCiId: props.fromCiId,
      toCiId: props.toCiId,
      relationshipTypeId: props.relationshipTypeId,
      isActive: true,
      validFrom,
      validTo: props.validTo ?? null,
      note: props.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute an existing CI relationship from persistence
   */
  static reconstitute(props: CIRelationshipProps): CIRelationship {
    return new CIRelationship(props);
  }

  /**
   * Update relationship properties
   */
  update(props: UpdateCIRelationshipProps): void {
    if (props.validTo !== undefined) {
      if (props.validTo && props.validTo <= this.props.validFrom) {
        throw new Error("Valid to date must be after valid from date");
      }
      this.props.validTo = props.validTo;
    }

    if (props.note !== undefined) {
      this.props.note = props.note?.trim() || null;
    }

    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate the relationship (soft delete)
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.validTo = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Activate the relationship
   */
  activate(): void {
    this.props.isActive = true;
    this.props.validTo = null;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if relationship is currently valid (within date range and active)
   */
  isCurrentlyValid(): boolean {
    if (!this.props.isActive) {
      return false;
    }

    const now = new Date();
    return this.isValidOn(now);
  }

  /**
   * Check if relationship is valid on a specific date
   */
  isValidOn(date: Date): boolean {
    if (!this.props.isActive) {
      return false;
    }

    const isAfterValidFrom = date >= this.props.validFrom;
    const isBeforeValidTo = !this.props.validTo || date <= this.props.validTo;

    return isAfterValidFrom && isBeforeValidTo;
  }

  /**
   * Check if relationship is expired
   */
  isExpired(): boolean {
    if (!this.props.validTo) {
      return false;
    }

    return new Date() > this.props.validTo;
  }

  /**
   * Validate relationship properties
   */
  private validate(): void {
    if (!this.props.id) {
      throw new Error("CI Relationship ID is required");
    }
    if (!this.props.fromCiId) {
      throw new Error("From CI ID is required");
    }
    if (!this.props.toCiId) {
      throw new Error("To CI ID is required");
    }
    if (!this.props.relationshipTypeId) {
      throw new Error("Relationship Type ID is required");
    }
    if (this.props.fromCiId === this.props.toCiId) {
      throw new Error("Cannot create relationship from CI to itself");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get fromCiId(): string {
    return this.props.fromCiId;
  }

  get toCiId(): string {
    return this.props.toCiId;
  }

  get relationshipTypeId(): string {
    return this.props.relationshipTypeId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get validFrom(): Date {
    return this.props.validFrom;
  }

  get validTo(): Date | null {
    return this.props.validTo;
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

  /**
   * Convert entity to plain object for persistence
   */
  toObject(): CIRelationshipProps {
    return { ...this.props };
  }
}
