/**
 * AssetAssignment Domain Entity
 * Represents assignment of assets to persons, organizations, locations, or CIs
 * Supports temporal tracking (start/end dates) and primary assignment designation
 */

export type AssigneeType = "PERSON" | "ORG_UNIT" | "LOCATION" | "CI";

export interface AssetAssignmentProps {
  id: string;
  assetId: string;
  assigneeType: AssigneeType;
  assigneeId: string;
  startDate: Date;
  endDate: Date | null;
  isPrimary: boolean;
  conditionOnAssignment: string | null;
  conditionOnReturn: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetAssignmentProps {
  assetId: string;
  assigneeType: AssigneeType;
  assigneeId: string;
  startDate?: Date;
  endDate?: Date | null;
  isPrimary?: boolean;
  conditionOnAssignment?: string | null;
  conditionOnReturn?: string | null;
  note?: string | null;
}

export class AssetAssignment {
  private constructor(private props: AssetAssignmentProps) {}

  /**
   * Factory method: Create a new asset assignment
   */
  static create(props: CreateAssetAssignmentProps): AssetAssignment {
    // Validation
    AssetAssignment.validateAssigneeType(props.assigneeType);
    AssetAssignment.validateAssigneeId(props.assigneeId);

    if (props.endDate) {
      const startDate = props.startDate || new Date();
      AssetAssignment.validateDateRange(startDate, props.endDate);
    }

    const now = new Date();

    return new AssetAssignment({
      id: "", // Will be set by repository
      assetId: props.assetId,
      assigneeType: props.assigneeType,
      assigneeId: props.assigneeId,
      startDate: props.startDate || now,
      endDate: props.endDate || null,
      isPrimary: props.isPrimary || false,
      conditionOnAssignment: props.conditionOnAssignment || null,
      conditionOnReturn: props.conditionOnReturn || null,
      note: props.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: AssetAssignmentProps): AssetAssignment {
    return new AssetAssignment(props);
  }

  /**
   * Update assignment details
   */
  update(props: {
    assigneeType?: AssigneeType;
    assigneeId?: string;
    startDate?: Date;
    endDate?: Date | null;
    isPrimary?: boolean;
    conditionOnAssignment?: string | null;
    conditionOnReturn?: string | null;
    note?: string | null;
  }): void {
    if (props.assigneeType !== undefined) {
      AssetAssignment.validateAssigneeType(props.assigneeType);
      this.props.assigneeType = props.assigneeType;
    }

    if (props.assigneeId !== undefined) {
      AssetAssignment.validateAssigneeId(props.assigneeId);
      this.props.assigneeId = props.assigneeId;
    }

    if (props.startDate !== undefined) {
      // Validate date range if endDate exists
      if (this.props.endDate) {
        AssetAssignment.validateDateRange(props.startDate, this.props.endDate);
      }
      this.props.startDate = props.startDate;
    }

    if (props.endDate !== undefined) {
      if (props.endDate !== null) {
        AssetAssignment.validateDateRange(this.props.startDate, props.endDate);
      }
      this.props.endDate = props.endDate;
    }

    if (props.isPrimary !== undefined) {
      this.props.isPrimary = props.isPrimary;
    }

    if (props.conditionOnAssignment !== undefined) {
      this.props.conditionOnAssignment = props.conditionOnAssignment;
    }

    if (props.conditionOnReturn !== undefined) {
      this.props.conditionOnReturn = props.conditionOnReturn;
    }

    if (props.note !== undefined) {
      this.props.note = props.note?.trim() || null;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * End the assignment
   * Business rule: Set end date to now or specified date
   */
  endAssignment(endDate?: Date): void {
    const end = endDate || new Date();

    // Business rule: End date cannot be before start date
    AssetAssignment.validateDateRange(this.props.startDate, end);

    this.props.endDate = end;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as primary assignment
   * Business rule: Only one primary assignment per asset at a time
   */
  setAsPrimary(): void {
    this.props.isPrimary = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Unmark as primary assignment
   */
  unsetAsPrimary(): void {
    this.props.isPrimary = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if assignment is currently active
   * Business rule: Active if no end date or end date is in the future
   */
  isActive(): boolean {
    if (!this.props.endDate) {
      return true;
    }
    return this.props.endDate > new Date();
  }

  /**
   * Check if assignment was active on a specific date
   */
  wasActiveOn(date: Date): boolean {
    if (date < this.props.startDate) {
      return false;
    }

    if (!this.props.endDate) {
      return true;
    }

    return date <= this.props.endDate;
  }

  /**
   * Get assignment duration in days
   */
  getDurationInDays(): number {
    const end = this.props.endDate || new Date();
    const diff = end.getTime() - this.props.startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Business Rules & Validation

  private static validateAssigneeType(type: AssigneeType): void {
    const validTypes: AssigneeType[] = ["PERSON", "ORG_UNIT", "LOCATION", "CI"];
    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid assignee type "${type}". Must be one of: ${validTypes.join(", ")}`,
      );
    }
  }

  private static validateAssigneeId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Assignee ID cannot be empty");
    }
  }

  private static validateDateRange(startDate: Date, endDate: Date): void {
    if (endDate < startDate) {
      throw new Error("End date cannot be before start date");
    }
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get assetId(): string {
    return this.props.assetId;
  }

  get assigneeType(): AssigneeType {
    return this.props.assigneeType;
  }

  get assigneeId(): string {
    return this.props.assigneeId;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | null {
    return this.props.endDate;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get conditionOnAssignment(): string | null {
    return this.props.conditionOnAssignment;
  }

  get conditionOnReturn(): string | null {
    return this.props.conditionOnReturn;
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

  // Internal setters (for repository use)

  setId(id: string): void {
    if (this.props.id) {
      throw new Error(
        "Cannot change asset assignment ID after it has been set",
      );
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): AssetAssignmentProps {
    return { ...this.props };
  }

  /**
   * Compare with another asset assignment
   */
  equals(other: AssetAssignment): boolean {
    return this.props.id === other.id;
  }
}
