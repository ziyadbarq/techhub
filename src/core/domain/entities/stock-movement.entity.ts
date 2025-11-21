/**
 * StockMovement Domain Entity
 * Tracks all inventory movements (receive, issue, transfer, adjustment)
 */

export type StockMovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

export interface StockMovementProps {
  id: string;
  movementType: StockMovementType;
  stockLocationFromId: string | null;
  stockLocationToId: string | null;
  assetId: string | null;
  quantity: number;
  reason: string | null;
  performedById: string;
  occurredAt: Date;
  createdAt: Date;
}

export interface CreateStockMovementProps {
  movementType: StockMovementType;
  stockLocationFromId?: string | null;
  stockLocationToId?: string | null;
  assetId?: string | null;
  quantity?: number;
  reason?: string | null;
  performedById: string;
  occurredAt?: Date;
}

export class StockMovement {
  private constructor(private props: StockMovementProps) {}

  static create(props: CreateStockMovementProps): StockMovement {
    StockMovement.validateMovementType(props.movementType);
    StockMovement.validateQuantity(props.quantity || 1);
    StockMovement.validatePerformedById(props.performedById);
    StockMovement.validateMovementLogic(
      props.movementType,
      props.stockLocationFromId,
      props.stockLocationToId,
    );

    const now = new Date();

    return new StockMovement({
      id: "",
      movementType: props.movementType,
      stockLocationFromId: props.stockLocationFromId || null,
      stockLocationToId: props.stockLocationToId || null,
      assetId: props.assetId || null,
      quantity: props.quantity || 1,
      reason: props.reason?.trim() || null,
      performedById: props.performedById,
      occurredAt: props.occurredAt || now,
      createdAt: now,
    });
  }

  static reconstitute(props: StockMovementProps): StockMovement {
    return new StockMovement(props);
  }

  isReceiving(): boolean {
    return this.props.movementType === "IN";
  }

  isIssuing(): boolean {
    return this.props.movementType === "OUT";
  }

  isTransfer(): boolean {
    return this.props.movementType === "TRANSFER";
  }

  isAdjustment(): boolean {
    return this.props.movementType === "ADJUSTMENT";
  }

  private static validateMovementType(type: StockMovementType): void {
    const validTypes: StockMovementType[] = [
      "IN",
      "OUT",
      "TRANSFER",
      "ADJUSTMENT",
    ];
    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid movement type "${type}". Must be one of: ${validTypes.join(", ")}`,
      );
    }
  }

  private static validateQuantity(quantity: number): void {
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    if (!Number.isInteger(quantity)) {
      throw new Error("Quantity must be a whole number");
    }
  }

  private static validatePerformedById(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Performed by ID cannot be empty");
    }
  }

  private static validateMovementLogic(
    type: StockMovementType,
    fromId: string | null | undefined,
    toId: string | null | undefined,
  ): void {
    switch (type) {
      case "IN":
        if (!toId) {
          throw new Error("IN movement requires destination stock location");
        }
        if (fromId) {
          throw new Error("IN movement should not have source stock location");
        }
        break;

      case "OUT":
        if (!fromId) {
          throw new Error("OUT movement requires source stock location");
        }
        if (toId) {
          throw new Error(
            "OUT movement should not have destination stock location",
          );
        }
        break;

      case "TRANSFER":
        if (!fromId || !toId) {
          throw new Error(
            "TRANSFER movement requires both source and destination stock locations",
          );
        }
        if (fromId === toId) {
          throw new Error(
            "TRANSFER movement cannot have same source and destination",
          );
        }
        break;

      case "ADJUSTMENT":
        // Adjustments can have from, to, or both depending on the scenario
        break;
    }
  }

  get id(): string {
    return this.props.id;
  }

  get movementType(): StockMovementType {
    return this.props.movementType;
  }

  get stockLocationFromId(): string | null {
    return this.props.stockLocationFromId;
  }

  get stockLocationToId(): string | null {
    return this.props.stockLocationToId;
  }

  get assetId(): string | null {
    return this.props.assetId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  get performedById(): string {
    return this.props.performedById;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  setId(id: string): void {
    if (this.props.id) {
      throw new Error("Cannot change stock movement ID after it has been set");
    }
    this.props.id = id;
  }

  toObject(): StockMovementProps {
    return { ...this.props };
  }

  equals(other: StockMovement): boolean {
    return this.props.id === other.id;
  }
}
