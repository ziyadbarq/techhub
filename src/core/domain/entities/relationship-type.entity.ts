/**
 * RelationshipType Entity
 *
 * Defines types of relationships between Configuration Items (e.g., "depends on", "hosts", "connects to").
 * Supports both unidirectional and bidirectional relationships with impact tracking.
 */

export type RelationshipDirection = "UNIDIRECTIONAL" | "BIDIRECTIONAL";

export interface RelationshipTypeProps {
  id: string;
  name: string;
  code: string;
  description: string | null;
  direction: RelationshipDirection;
  isImpacting: boolean; // If "to" CI fails, does "from" CI fail?
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRelationshipTypeProps {
  name: string;
  code: string;
  description?: string | null;
  direction?: RelationshipDirection;
  isImpacting?: boolean;
}

export interface UpdateRelationshipTypeProps {
  name?: string;
  description?: string | null;
  direction?: RelationshipDirection;
  isImpacting?: boolean;
}

export class RelationshipType {
  private constructor(private props: RelationshipTypeProps) {
    this.validate();
  }

  /**
   * Factory method to create a new relationship type
   */
  static create(props: CreateRelationshipTypeProps): RelationshipType {
    // Validation
    this.validateName(props.name);
    this.validateCode(props.code);

    const now = new Date();

    return new RelationshipType({
      id: crypto.randomUUID(),
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      direction: props.direction || "UNIDIRECTIONAL",
      isImpacting: props.isImpacting ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute an existing relationship type from persistence
   */
  static reconstitute(props: RelationshipTypeProps): RelationshipType {
    return new RelationshipType(props);
  }

  /**
   * Update relationship type properties
   */
  update(props: UpdateRelationshipTypeProps): void {
    if (props.name !== undefined) {
      RelationshipType.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.direction !== undefined) {
      this.props.direction = props.direction;
    }

    if (props.isImpacting !== undefined) {
      this.props.isImpacting = props.isImpacting;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Check if relationship is bidirectional
   */
  isBidirectional(): boolean {
    return this.props.direction === "BIDIRECTIONAL";
  }

  /**
   * Check if relationship is unidirectional
   */
  isUnidirectional(): boolean {
    return this.props.direction === "UNIDIRECTIONAL";
  }

  /**
   * Check if relationship causes impact propagation
   */
  isImpacting(): boolean {
    return this.props.isImpacting;
  }

  /**
   * Validate name format
   */
  static validateName(name: string): void {
    if (!name?.trim()) {
      throw new Error("Relationship type name is required");
    }
    if (name.trim().length < 2) {
      throw new Error("Relationship type name must be at least 2 characters");
    }
    if (name.trim().length > 100) {
      throw new Error("Relationship type name must not exceed 100 characters");
    }
  }

  /**
   * Validate code format
   */
  static validateCode(code: string): void {
    if (!code?.trim()) {
      throw new Error("Relationship type code is required");
    }

    const trimmedCode = code.trim();

    if (trimmedCode.length < 2) {
      throw new Error("Relationship type code must be at least 2 characters");
    }
    if (trimmedCode.length > 50) {
      throw new Error("Relationship type code must not exceed 50 characters");
    }

    // Code should be alphanumeric with underscores/hyphens
    const codePattern = /^[A-Z0-9_-]+$/;
    if (!codePattern.test(trimmedCode.toUpperCase())) {
      throw new Error(
        "Relationship type code must contain only uppercase letters, numbers, underscores, and hyphens",
      );
    }
  }

  /**
   * Validate entity properties
   */
  private validate(): void {
    if (!this.props.id) {
      throw new Error("Relationship type ID is required");
    }
    RelationshipType.validateName(this.props.name);
    RelationshipType.validateCode(this.props.code);

    const validDirections: RelationshipDirection[] = [
      "UNIDIRECTIONAL",
      "BIDIRECTIONAL",
    ];
    if (!validDirections.includes(this.props.direction)) {
      throw new Error(
        `Invalid relationship direction: ${this.props.direction}`,
      );
    }
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

  get description(): string | null {
    return this.props.description;
  }

  get direction(): RelationshipDirection {
    return this.props.direction;
  }

  get impacting(): boolean {
    return this.props.isImpacting;
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
  toObject(): RelationshipTypeProps {
    return { ...this.props };
  }
}
