/**
 * StockLocation Domain Entity
 * Represents physical storage locations for inventory management
 */

export interface StockLocationProps {
  id: string;
  name: string;
  code: string;
  locationId: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStockLocationProps {
  name: string;
  code: string;
  locationId?: string | null;
  description?: string | null;
}

export class StockLocation {
  private constructor(private props: StockLocationProps) {}

  static create(props: CreateStockLocationProps): StockLocation {
    StockLocation.validateName(props.name);
    StockLocation.validateCode(props.code);

    const now = new Date();

    return new StockLocation({
      id: "",
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      locationId: props.locationId || null,
      description: props.description?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: StockLocationProps): StockLocation {
    return new StockLocation(props);
  }

  update(props: {
    name?: string;
    code?: string;
    locationId?: string | null;
    description?: string | null;
  }): void {
    if (props.name !== undefined) {
      StockLocation.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.code !== undefined) {
      StockLocation.validateCode(props.code);
      this.props.code = props.code.trim().toUpperCase();
    }

    if (props.locationId !== undefined) {
      this.props.locationId = props.locationId;
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    this.props.updatedAt = new Date();
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Stock location name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Stock location name must be at least 2 characters");
    }

    if (name.trim().length > 200) {
      throw new Error("Stock location name cannot exceed 200 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Stock location code cannot be empty");
    }

    if (code.trim().length < 2) {
      throw new Error("Stock location code must be at least 2 characters");
    }

    if (code.trim().length > 50) {
      throw new Error("Stock location code cannot exceed 50 characters");
    }

    if (!/^[A-Z0-9\-_]+$/i.test(code.trim())) {
      throw new Error(
        "Stock location code can only contain letters, numbers, hyphens, and underscores",
      );
    }
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get locationId(): string | null {
    return this.props.locationId;
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

  setId(id: string): void {
    if (this.props.id) {
      throw new Error("Cannot change stock location ID after it has been set");
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Check if stock location can be deleted
   * Business rule: Cannot delete if has assets or stock movements
   */
  canBeDeleted(hasAssets: boolean, hasMovements: boolean): boolean {
    return !hasAssets && !hasMovements;
  }

  toObject(): StockLocationProps {
    return { ...this.props };
  }

  equals(other: StockLocation): boolean {
    return this.props.id === other.id;
  }
}
