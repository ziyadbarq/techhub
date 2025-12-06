/**
 * AssetKitCheckoutItem Entity
 *
 * Tracks individual assets within a kit checkout (actual asset assigned to each kit slot).
 * Manages return status, condition tracking, and damage/loss reporting.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export type KitCheckoutItemStatus =
  | "CHECKED_OUT"
  | "RETURNED"
  | "DAMAGED"
  | "LOST";

export interface AssetKitCheckoutItemProps {
  id: string;
  kitCheckoutId: string;
  assetId: string;
  kitItemId: string;
  checkoutDate: Date;
  returnDate: Date | null;
  status: KitCheckoutItemStatus;
  conditionAtCheckout: string | null;
  conditionAtReturn: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetKitCheckoutItemProps {
  kitCheckoutId: string;
  assetId: string;
  kitItemId: string;
  conditionAtCheckout?: string | null;
  note?: string | null;
}

export class AssetKitCheckoutItem {
  private constructor(private props: AssetKitCheckoutItemProps) {
    this.validate();
  }

  static create(
    props: CreateAssetKitCheckoutItemProps,
    idGenerator: IIdGenerator,
  ): AssetKitCheckoutItem {
    if (!props.kitCheckoutId?.trim()) {
      throw new Error("Kit checkout ID is required");
    }
    if (!props.assetId?.trim()) {
      throw new Error("Asset ID is required");
    }
    if (!props.kitItemId?.trim()) {
      throw new Error("Kit item ID is required");
    }

    const now = new Date();

    return new AssetKitCheckoutItem({
      id: idGenerator.generateId(),
      kitCheckoutId: props.kitCheckoutId,
      assetId: props.assetId,
      kitItemId: props.kitItemId,
      checkoutDate: now,
      returnDate: null,
      status: "CHECKED_OUT",
      conditionAtCheckout: props.conditionAtCheckout?.trim() || null,
      conditionAtReturn: null,
      note: props.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AssetKitCheckoutItemProps): AssetKitCheckoutItem {
    return new AssetKitCheckoutItem(props);
  }

  // Workflow methods
  returnItem(conditionAtReturn?: string): void {
    if (this.props.status === "RETURNED") {
      throw new Error("Item already returned");
    }
    if (this.props.status === "LOST") {
      throw new Error("Cannot return lost item");
    }

    this.props.status = "RETURNED";
    this.props.returnDate = new Date();
    this.props.conditionAtReturn = conditionAtReturn?.trim() || null;
    this.props.updatedAt = new Date();
  }

  markAsDamaged(conditionDescription: string): void {
    if (this.props.status === "RETURNED") {
      throw new Error("Cannot mark returned item as damaged");
    }
    if (this.props.status === "LOST") {
      throw new Error("Cannot mark lost item as damaged");
    }

    if (!conditionDescription?.trim()) {
      throw new Error(
        "Condition description is required when marking as damaged",
      );
    }

    this.props.status = "DAMAGED";
    this.props.returnDate = new Date();
    this.props.conditionAtReturn = conditionDescription.trim();
    this.props.updatedAt = new Date();
  }

  markAsLost(): void {
    if (this.props.status === "RETURNED") {
      throw new Error("Cannot mark returned item as lost");
    }

    this.props.status = "LOST";
    this.props.returnDate = new Date();
    this.props.conditionAtReturn = "Item reported as lost";
    this.props.updatedAt = new Date();
  }

  updateNote(note: string): void {
    this.props.note = note?.trim() || null;
    this.props.updatedAt = new Date();
  }

  // Status checks
  isCheckedOut(): boolean {
    return this.props.status === "CHECKED_OUT";
  }

  isReturned(): boolean {
    return this.props.status === "RETURNED";
  }

  isDamaged(): boolean {
    return this.props.status === "DAMAGED";
  }

  isLost(): boolean {
    return this.props.status === "LOST";
  }

  hasConditionIssues(): boolean {
    return this.props.status === "DAMAGED" || this.props.status === "LOST";
  }

  getCheckoutDurationDays(): number | null {
    if (!this.props.returnDate) {
      // Still checked out - calculate from now
      const now = new Date();
      const diff = now.getTime() - this.props.checkoutDate.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // Already returned - calculate actual duration
    const diff =
      this.props.returnDate.getTime() - this.props.checkoutDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Checkout item ID is required");
    }
    if (!this.props.kitCheckoutId) {
      throw new Error("Kit checkout ID is required");
    }
    if (!this.props.assetId) {
      throw new Error("Asset ID is required");
    }
    if (!this.props.kitItemId) {
      throw new Error("Kit item ID is required");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get kitCheckoutId(): string {
    return this.props.kitCheckoutId;
  }

  get assetId(): string {
    return this.props.assetId;
  }

  get kitItemId(): string {
    return this.props.kitItemId;
  }

  get checkoutDate(): Date {
    return this.props.checkoutDate;
  }

  get returnDate(): Date | null {
    return this.props.returnDate;
  }

  get status(): KitCheckoutItemStatus {
    return this.props.status;
  }

  get conditionAtCheckout(): string | null {
    return this.props.conditionAtCheckout;
  }

  get conditionAtReturn(): string | null {
    return this.props.conditionAtReturn;
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

  toObject(): AssetKitCheckoutItemProps {
    return { ...this.props };
  }
}
