/**
 * PersonRoleAssignment Domain Entity
 * Temporal role assignments for people
 */

export interface PersonRoleAssignmentProps {
  id: string;
  personId: string;
  roleId: string;
  scope: string | null;
  startDate: Date;
  endDate: Date | null;
  isPrimary: boolean;
  isActive: boolean;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonRoleAssignmentProps {
  personId: string;
  roleId: string;
  scope?: string | null;
  startDate?: Date;
  endDate?: Date | null;
  isPrimary?: boolean;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class PersonRoleAssignment {
  private constructor(private props: PersonRoleAssignmentProps) {}

  static create(props: CreatePersonRoleAssignmentProps): PersonRoleAssignment {
    PersonRoleAssignment.validatePersonId(props.personId);
    PersonRoleAssignment.validateRoleId(props.roleId);
    PersonRoleAssignment.validateDates(props.startDate, props.endDate);

    const now = new Date();

    return new PersonRoleAssignment({
      id: "",
      personId: props.personId,
      roleId: props.roleId,
      scope: props.scope?.trim() || null,
      startDate: props.startDate || now,
      endDate: props.endDate || null,
      isPrimary: props.isPrimary || false,
      isActive: true,
      note: props.note?.trim() || null,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PersonRoleAssignmentProps): PersonRoleAssignment {
    return new PersonRoleAssignment(props);
  }

  update(props: {
    scope?: string | null;
    startDate?: Date;
    endDate?: Date | null;
    isPrimary?: boolean;
    note?: string | null;
    metadata?: Record<string, unknown> | null;
  }): void {
    if (props.startDate !== undefined || props.endDate !== undefined) {
      const newStart = props.startDate ?? this.props.startDate;
      const newEnd =
        props.endDate !== undefined ? props.endDate : this.props.endDate;
      PersonRoleAssignment.validateDates(newStart, newEnd);

      if (props.startDate !== undefined) {
        this.props.startDate = props.startDate;
      }
      if (props.endDate !== undefined) {
        this.props.endDate = props.endDate;
      }
    }

    if (props.scope !== undefined) {
      this.props.scope = props.scope?.trim() || null;
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

  end(endDate?: Date): void {
    const date = endDate || new Date();
    PersonRoleAssignment.validateDates(this.props.startDate, date);
    this.props.endDate = date;
    this.props.updatedAt = new Date();
  }

  extend(newEndDate: Date | null): void {
    PersonRoleAssignment.validateDates(this.props.startDate, newEndDate);
    this.props.endDate = newEndDate;
    this.props.updatedAt = new Date();
  }

  private static validatePersonId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Person ID cannot be empty");
    }
  }

  private static validateRoleId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Role ID cannot be empty");
    }
  }

  private static validateDates(startDate?: Date, endDate?: Date | null): void {
    if (startDate && endDate && endDate < startDate) {
      throw new Error("End date cannot be before start date");
    }
  }

  isActive(asOf?: Date): boolean {
    const date = asOf || new Date();
    const started = date >= this.props.startDate;
    const notEnded = !this.props.endDate || date <= this.props.endDate;
    return started && notEnded;
  }

  hasEnded(asOf?: Date): boolean {
    if (!this.props.endDate) return false;
    const date = asOf || new Date();
    return date > this.props.endDate;
  }

  overlaps(other: PersonRoleAssignment): boolean {
    // Same person and role
    if (
      this.props.personId !== other.personId ||
      this.props.roleId !== other.roleId ||
      this.props.id === other.id
    ) {
      return false;
    }

    // Check date overlap
    const thisStart = this.props.startDate;
    const thisEnd = this.props.endDate || new Date(9999, 11, 31);
    const otherStart = other.startDate;
    const otherEnd = other.endDate || new Date(9999, 11, 31);

    return thisStart <= otherEnd && otherStart <= thisEnd;
  }

  get id(): string {
    return this.props.id;
  }
  get personId(): string {
    return this.props.personId;
  }
  get roleId(): string {
    return this.props.roleId;
  }
  get scope(): string | null {
    return this.props.scope;
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
  get active(): boolean {
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
      throw new Error("Cannot change assignment ID after it has been set");
    this.props.id = id;
  }
  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  toObject(): PersonRoleAssignmentProps {
    return { ...this.props };
  }

  equals(other: PersonRoleAssignment): boolean {
    return this.props.id === other.id;
  }
}
