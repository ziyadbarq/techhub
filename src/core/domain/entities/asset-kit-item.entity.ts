/**
 * AssetKitItem Entity
 *
 * Represents an item in an asset kit template.
 * Defines required asset categories/models with quantities.
 */

export interface AssetKitItemProps {
  id: string;
  assetKitId: string;
  assetCategoryId: string;
  assetModelId: string | null;
  quantity: number;
  isRequired: boolean;
  note: string | null;
  createdAt: Date;
}

export interface CreateAssetKitItemProps {
  assetKitId: string;
  assetCategoryId: string;
  assetModelId?: string | null;
  quantity?: number;
  isRequired?: boolean;
  note?: string | null;
}

export class AssetKitItem {
  private constructor(private props: AssetKitItemProps) {
    this.validate();
  }

  static create(props: CreateAssetKitItemProps): AssetKitItem {
    if (!props.assetKitId?.trim()) {
      throw new Error("Asset kit ID is required");
    }
    if (!props.assetCategoryId?.trim()) {
      throw new Error("Asset category ID is required");
    }

    const quantity = props.quantity ?? 1;
    AssetKitItem.validateQuantity(quantity);

    return new AssetKitItem({
      id: crypto.randomUUID(),
      assetKitId: props.assetKitId,
      assetCategoryId: props.assetCategoryId,
      assetModelId: props.assetModelId ?? null,
      quantity,
      isRequired: props.isRequired ?? true,
      note: props.note?.trim() || null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: AssetKitItemProps): AssetKitItem {
    return new AssetKitItem(props);
  }

  updateQuantity(quantity: number): void {
    AssetKitItem.validateQuantity(quantity);
    this.props.quantity = quantity;
  }

  updateNote(note: string | null): void {
    this.props.note = note?.trim() || null;
  }

  markAsRequired(): void {
    this.props.isRequired = true;
  }

  markAsOptional(): void {
    this.props.isRequired = false;
  }

  static validateQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Quantity must be a positive integer");
    }
    if (quantity > 100) {
      throw new Error("Quantity cannot exceed 100");
    }
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Kit item ID is required");
    }
    if (!this.props.assetKitId) {
      throw new Error("Asset kit ID is required");
    }
    if (!this.props.assetCategoryId) {
      throw new Error("Asset category ID is required");
    }
    AssetKitItem.validateQuantity(this.props.quantity);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get assetKitId(): string {
    return this.props.assetKitId;
  }

  get assetCategoryId(): string {
    return this.props.assetCategoryId;
  }

  get assetModelId(): string | null {
    return this.props.assetModelId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get note(): string | null {
    return this.props.note;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toObject(): AssetKitItemProps {
    return { ...this.props };
  }
}
