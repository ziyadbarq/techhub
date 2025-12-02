/**
 * PersonRoleAssignment Domain Entity
 *
 * This is a lightweight stub to maintain backward compatibility after
 * removing person ↔ role relational tables from the database. All write
 * operations should be treated as no-ops.
 */

export interface PersonRoleAssignmentProps {
  id: string;
  personId: string;
  roleId: string;
  scope: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isPrimary: boolean;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonRoleAssignmentProps {
  personId: string;
  roleId: string;
  scope?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  isPrimary?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

export class PersonRoleAssignment {
  private constructor(private props: PersonRoleAssignmentProps) {}

  static create(props: CreatePersonRoleAssignmentProps): PersonRoleAssignment {
    const now = new Date();
    return new PersonRoleAssignment({
      id: "",
      personId: props.personId,
      roleId: props.roleId,
      scope: props.scope ?? null,
      startDate: props.startDate ?? null,
      endDate: props.endDate ?? null,
      isPrimary: props.isPrimary ?? false,
      isActive: props.isActive ?? true,
      metadata: props.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PersonRoleAssignmentProps): PersonRoleAssignment {
    return new PersonRoleAssignment(props);
  }

  toObject(): PersonRoleAssignmentProps {
    return { ...this.props };
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
  get startDate(): Date | null {
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
    if (this.props.id) {
      throw new Error("Cannot change ID after it has been set");
    }
    this.props.id = id;
  }
}
