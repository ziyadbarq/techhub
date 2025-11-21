/**
 * AssetModel Domain Entity
 * Vendor-specific asset models (e.g., Dell Latitude 7490, HP LaserJet M404dn)
 */

export interface AssetModelProps {
  id: string;
  assetCategoryId: string;
  vendorId: string;
  name: string;
  code: string;
  description: string | null;
  defaultWarrantyMonths: number | null;
  defaultAttributes: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetModelProps {
  assetCategoryId: string;
  vendorId: string;
  name: string;
  code: string;
  description?: string | null;
  defaultWarrantyMonths?: number | null;
  defaultAttributes?: Record<string, unknown> | null;
}

export class AssetModel {
  private constructor(private props: AssetModelProps) {}

  static create(props: CreateAssetModelProps): AssetModel {
    AssetModel.validateName(props.name);
    AssetModel.validateCode(props.code);
    if (
      props.defaultWarrantyMonths !== undefined &&
      props.defaultWarrantyMonths !== null
    ) {
      AssetModel.validateWarrantyMonths(props.defaultWarrantyMonths);
    }

    const now = new Date();

    return new AssetModel({
      id: "",
      assetCategoryId: props.assetCategoryId,
      vendorId: props.vendorId,
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      defaultWarrantyMonths: props.defaultWarrantyMonths ?? null,
      defaultAttributes: props.defaultAttributes || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AssetModelProps): AssetModel {
    return new AssetModel(props);
  }

  update(props: {
    name?: string;
    code?: string;
    description?: string | null;
    assetCategoryId?: string;
    vendorId?: string;
    defaultWarrantyMonths?: number | null;
    defaultAttributes?: Record<string, unknown> | null;
  }): void {
    if (props.name !== undefined) {
      AssetModel.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.code !== undefined) {
      AssetModel.validateCode(props.code);
      this.props.code = props.code.trim().toUpperCase();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.assetCategoryId !== undefined) {
      this.props.assetCategoryId = props.assetCategoryId;
    }

    if (props.vendorId !== undefined) {
      this.props.vendorId = props.vendorId;
    }

    if (props.defaultWarrantyMonths !== undefined) {
      if (props.defaultWarrantyMonths !== null) {
        AssetModel.validateWarrantyMonths(props.defaultWarrantyMonths);
      }
      this.props.defaultWarrantyMonths = props.defaultWarrantyMonths;
    }

    if (props.defaultAttributes !== undefined) {
      this.props.defaultAttributes = props.defaultAttributes;
    }

    this.props.updatedAt = new Date();
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Asset model name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Asset model name must be at least 2 characters");
    }

    if (name.trim().length > 200) {
      throw new Error("Asset model name cannot exceed 200 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Asset model code cannot be empty");
    }

    if (code.trim().length < 2) {
      throw new Error("Asset model code must be at least 2 characters");
    }

    if (code.trim().length > 50) {
      throw new Error("Asset model code cannot exceed 50 characters");
    }

    if (!/^[A-Z0-9\-_]+$/i.test(code.trim())) {
      throw new Error(
        "Asset model code can only contain letters, numbers, hyphens, and underscores",
      );
    }
  }

  private static validateWarrantyMonths(months: number): void {
    if (months < 0) {
      throw new Error("Warranty months cannot be negative");
    }

    if (months > 120) {
      throw new Error("Warranty months cannot exceed 120 (10 years)");
    }
  }

  canBeDeleted(hasAssets: boolean): boolean {
    return !hasAssets;
  }

  get id(): string {
    return this.props.id;
  }

  get assetCategoryId(): string {
    return this.props.assetCategoryId;
  }

  get vendorId(): string {
    return this.props.vendorId;
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

  get defaultWarrantyMonths(): number | null {
    return this.props.defaultWarrantyMonths;
  }

  get defaultAttributes(): Record<string, unknown> | null {
    return this.props.defaultAttributes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  setId(id: string): void {
    if (this.props.id) {
      throw new Error("Cannot change asset model ID after it has been set");
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  toObject(): AssetModelProps {
    return { ...this.props };
  }

  equals(other: AssetModel): boolean {
    return this.props.id === other.id;
  }
}
