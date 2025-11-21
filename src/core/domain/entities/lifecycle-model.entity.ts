/**
 * LifecycleModel Domain Entity
 * Reusable state machine definitions for CIs, Assets, and Licenses
 */

export interface LifecycleModelProps {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLifecycleModelProps {
  name: string;
  description?: string | null;
}

export class LifecycleModel {
  private constructor(private props: LifecycleModelProps) {}

  /**
   * Factory method: Create a new lifecycle model
   */
  static create(props: CreateLifecycleModelProps): LifecycleModel {
    // Validation
    LifecycleModel.validateName(props.name);

    const now = new Date();

    return new LifecycleModel({
      id: "", // Will be set by repository
      name: props.name.trim(),
      description: props.description?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: LifecycleModelProps): LifecycleModel {
    return new LifecycleModel(props);
  }

  /**
   * Update lifecycle model details
   */
  update(props: { name?: string; description?: string | null }): void {
    if (props.name !== undefined) {
      LifecycleModel.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    this.props.updatedAt = new Date();
  }

  // Business Rules & Validation

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Lifecycle model name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Lifecycle model name must be at least 2 characters");
    }

    if (name.trim().length > 100) {
      throw new Error("Lifecycle model name cannot exceed 100 characters");
    }

    // Check for valid characters (alphanumeric, spaces, hyphens, underscores)
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
      throw new Error(
        "Lifecycle model name can only contain letters, numbers, spaces, hyphens, and underscores",
      );
    }
  }

  /**
   * Check if this model can be deleted
   * (Business rule: Cannot delete if states or transitions exist)
   */
  canBeDeleted(hasStates: boolean): boolean {
    return !hasStates;
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
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
      throw new Error("Cannot change lifecycle model ID after it has been set");
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): LifecycleModelProps {
    return {
      id: this.props.id,
      name: this.props.name,
      description: this.props.description,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  /**
   * Compare with another lifecycle model
   */
  equals(other: LifecycleModel): boolean {
    return this.props.id === other.id;
  }
}
