/**
 * AssetCategoryField Entity
 * Represents custom field definitions attached to asset categories with configuration
 */

export interface AssetCategoryFieldProps {
  id: string;
  assetCategoryId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isUnique: boolean;
  isVisible: boolean;
  defaultValue: Record<string, unknown> | null;
  uiOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetCategoryFieldProps {
  assetCategoryId: string;
  fieldDefinitionId: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  defaultValue?: Record<string, unknown> | null;
  uiOrder?: number;
}

export interface UpdateAssetCategoryFieldProps {
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  defaultValue?: Record<string, unknown> | null;
  uiOrder?: number;
}

export class AssetCategoryField {
  private constructor(private props: AssetCategoryFieldProps) {}

  // Factory method for creating new asset category fields
  static create(props: CreateAssetCategoryFieldProps): AssetCategoryField {
    AssetCategoryField.validateAssetCategoryId(props.assetCategoryId);
    AssetCategoryField.validateFieldDefinitionId(props.fieldDefinitionId);
    AssetCategoryField.validateUIOrder(props.uiOrder ?? 0);

    const now = new Date();

    return new AssetCategoryField({
      id: "",
      assetCategoryId: props.assetCategoryId,
      fieldDefinitionId: props.fieldDefinitionId,
      isRequired: props.isRequired ?? false,
      isUnique: props.isUnique ?? false,
      isVisible: props.isVisible ?? true,
      defaultValue: props.defaultValue ?? null,
      uiOrder: props.uiOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: AssetCategoryFieldProps): AssetCategoryField {
    return new AssetCategoryField(props);
  }

  // Update method
  update(props: UpdateAssetCategoryFieldProps): void {
    if (props.uiOrder !== undefined) {
      AssetCategoryField.validateUIOrder(props.uiOrder);
      this.props.uiOrder = props.uiOrder;
    }

    if (props.isRequired !== undefined) {
      this.props.isRequired = props.isRequired;
    }

    if (props.isUnique !== undefined) {
      this.props.isUnique = props.isUnique;
    }

    if (props.isVisible !== undefined) {
      this.props.isVisible = props.isVisible;
    }

    if (props.defaultValue !== undefined) {
      this.props.defaultValue = props.defaultValue;
    }

    this.props.updatedAt = new Date();
  }

  // Validation methods
  private static validateAssetCategoryId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Asset Category ID is required");
    }
  }

  private static validateFieldDefinitionId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Field Definition ID is required");
    }
  }

  private static validateUIOrder(order: number): void {
    if (order < 0) {
      throw new Error("UI Order must be non-negative");
    }
    if (!Number.isInteger(order)) {
      throw new Error("UI Order must be an integer");
    }
  }

  // Business logic methods
  makeRequired(): void {
    this.props.isRequired = true;
    this.props.updatedAt = new Date();
  }

  makeOptional(): void {
    this.props.isRequired = false;
    this.props.updatedAt = new Date();
  }

  makeUnique(): void {
    this.props.isUnique = true;
    this.props.updatedAt = new Date();
  }

  removeUniqueness(): void {
    this.props.isUnique = false;
    this.props.updatedAt = new Date();
  }

  show(): void {
    this.props.isVisible = true;
    this.props.updatedAt = new Date();
  }

  hide(): void {
    this.props.isVisible = false;
    this.props.updatedAt = new Date();
  }

  setDefaultValue(value: Record<string, unknown> | null): void {
    this.props.defaultValue = value;
    this.props.updatedAt = new Date();
  }

  setUIOrder(order: number): void {
    AssetCategoryField.validateUIOrder(order);
    this.props.uiOrder = order;
    this.props.updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get assetCategoryId(): string {
    return this.props.assetCategoryId;
  }

  get fieldDefinitionId(): string {
    return this.props.fieldDefinitionId;
  }

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get isUnique(): boolean {
    return this.props.isUnique;
  }

  get isVisible(): boolean {
    return this.props.isVisible;
  }

  get defaultValue(): Record<string, unknown> | null {
    return this.props.defaultValue;
  }

  get uiOrder(): number {
    return this.props.uiOrder;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
