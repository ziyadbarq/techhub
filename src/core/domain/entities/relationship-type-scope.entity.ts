/**
 * RelationshipTypeScope Entity
 * Defines valid CI class combinations for relationship types
 */

export interface RelationshipTypeScopeProps {
  id: string;
  relationshipTypeId: string;
  fromCiClassId: string;
  toCiClassId: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRelationshipTypeScopeProps {
  relationshipTypeId: string;
  fromCiClassId: string;
  toCiClassId: string;
  note?: string | null;
}

export interface UpdateRelationshipTypeScopeProps {
  note?: string | null;
}

export class RelationshipTypeScope {
  private constructor(private props: RelationshipTypeScopeProps) {}

  // Factory method for creating new relationship type scopes
  static create(
    props: CreateRelationshipTypeScopeProps,
  ): RelationshipTypeScope {
    RelationshipTypeScope.validateRelationshipTypeId(props.relationshipTypeId);
    RelationshipTypeScope.validateFromCiClassId(props.fromCiClassId);
    RelationshipTypeScope.validateToCiClassId(props.toCiClassId);

    const now = new Date();

    return new RelationshipTypeScope({
      id: "",
      relationshipTypeId: props.relationshipTypeId,
      fromCiClassId: props.fromCiClassId,
      toCiClassId: props.toCiClassId,
      note: props.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(
    props: RelationshipTypeScopeProps,
  ): RelationshipTypeScope {
    return new RelationshipTypeScope(props);
  }

  // Update method
  update(props: UpdateRelationshipTypeScopeProps): void {
    if (props.note !== undefined) {
      this.props.note = props.note?.trim() || null;
    }

    this.props.updatedAt = new Date();
  }

  // Validation methods
  private static validateRelationshipTypeId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Relationship type ID is required");
    }
  }

  private static validateFromCiClassId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("From CI class ID is required");
    }
  }

  private static validateToCiClassId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("To CI class ID is required");
    }
  }

  // Business logic methods
  isSelfReferencing(): boolean {
    return this.props.fromCiClassId === this.props.toCiClassId;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get relationshipTypeId(): string {
    return this.props.relationshipTypeId;
  }

  get fromCiClassId(): string {
    return this.props.fromCiClassId;
  }

  get toCiClassId(): string {
    return this.props.toCiClassId;
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
}
