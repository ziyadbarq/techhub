/**
 * AssetCategory Domain Entity
 * Defines types of assets (Printer, Laptop, Monitor, Server, etc.)
 * Links to LifecycleModel and FieldDefinitions for custom attributes
 */

export interface AssetCategoryProps {
  id: string;
  name: string;
  code: string;
  description: string | null;
  lifecycleModelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetCategoryProps {
  name: string;
  code: string;
  description?: string | null;
  lifecycleModelId?: string | null;
}

export class AssetCategory {
  private constructor(private props: AssetCategoryProps) {}

  /**
   * Factory method: Create a new asset category
   */
  static create(props: CreateAssetCategoryProps): AssetCategory {
    // Validation
    AssetCategory.validateName(props.name);
    AssetCategory.validateCode(props.code);

    const now = new Date();

    return new AssetCategory({
      id: "", // Will be set by repository
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      lifecycleModelId: props.lifecycleModelId || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: AssetCategoryProps): AssetCategory {
    return new AssetCategory(props);
  }

  /**
   * Update asset category details
   */
  update(props: {
    name?: string;
    code?: string;
    description?: string | null;
    lifecycleModelId?: string | null;
  }): void {
    if (props.name !== undefined) {
      AssetCategory.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.code !== undefined) {
      AssetCategory.validateCode(props.code);
      this.props.code = props.code.trim().toUpperCase();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.lifecycleModelId !== undefined) {
      this.props.lifecycleModelId = props.lifecycleModelId;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Link to a lifecycle model
   */
  setLifecycleModel(lifecycleModelId: string | null): void {
    this.props.lifecycleModelId = lifecycleModelId;
    this.props.updatedAt = new Date();
  }

  // Business Rules & Validation

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Asset category name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Asset category name must be at least 2 characters");
    }

    if (name.trim().length > 200) {
      throw new Error("Asset category name cannot exceed 200 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Asset category code cannot be empty");
    }

    if (code.trim().length < 2) {
      throw new Error("Asset category code must be at least 2 characters");
    }

    if (code.trim().length > 50) {
      throw new Error("Asset category code cannot exceed 50 characters");
    }

    // Must be alphanumeric, hyphens, underscores
    if (!/^[A-Z0-9\-_]+$/i.test(code.trim())) {
      throw new Error(
        "Asset category code can only contain letters, numbers, hyphens, and underscores",
      );
    }
  }

  /**
   * Check if category can be deleted
   * Business rule: Cannot delete if has asset models or assets
   */
  canBeDeleted(hasAssetModels: boolean, hasAssets: boolean): boolean {
    return !hasAssetModels && !hasAssets;
  }

  /**
   * Check if has lifecycle model
   */
  hasLifecycleModel(): boolean {
    return this.props.lifecycleModelId !== null;
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

  get lifecycleModelId(): string | null {
    return this.props.lifecycleModelId;
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
      throw new Error("Cannot change asset category ID after it has been set");
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): AssetCategoryProps {
    return { ...this.props };
  }

  /**
   * Compare with another asset category
   */
  equals(other: AssetCategory): boolean {
    return this.props.id === other.id;
  }
}
