/**
 * AssetKitCheckout Entity
 *
 * Represents an actual kit checkout instance (kit assigned to a person/org unit).
 * Tracks status, dates, and individual asset items.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export type KitCheckoutStatus =
  | "CHECKED_OUT"
  | "PARTIALLY_RETURNED"
  | "RETURNED"
  | "CANCELLED";
export type AssigneeType = "PERSON" | "ORG_UNIT" | "LOCATION";

export interface AssetKitCheckoutProps {
  id: string;
  assetKitId: string;
  assigneeType: AssigneeType;
  assigneeId: string;
  checkoutDate: Date;
  expectedReturnDate: Date | null;
  actualReturnDate: Date | null;
  status: KitCheckoutStatus;
  checkedOutById: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetKitCheckoutProps {
  assetKitId: string;
  assigneeType: AssigneeType;
  assigneeId: string;
  checkedOutById: string;
  expectedReturnDate?: Date | null;
  note?: string | null;
}

export class AssetKitCheckout {
  private constructor(private props: AssetKitCheckoutProps) {
    this.validate();
  }

  static create(
    props: CreateAssetKitCheckoutProps,
    idGenerator: IIdGenerator,
  ): AssetKitCheckout {
    if (!props.assetKitId?.trim()) {
      throw new Error("Asset kit ID is required");
    }
    if (!props.assigneeId?.trim()) {
      throw new Error("Assignee ID is required");
    }
    if (!props.checkedOutById?.trim()) {
      throw new Error("Checked out by ID is required");
    }

    const now = new Date();

    return new AssetKitCheckout({
      id: idGenerator.generateId(),
      assetKitId: props.assetKitId,
      assigneeType: props.assigneeType,
      assigneeId: props.assigneeId,
      checkoutDate: now,
      expectedReturnDate: props.expectedReturnDate ?? null,
      actualReturnDate: null,
      status: "CHECKED_OUT",
      checkedOutById: props.checkedOutById,
      note: props.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AssetKitCheckoutProps): AssetKitCheckout {
    return new AssetKitCheckout(props);
  }

  // Workflow methods
  returnAllItems(): void {
    if (this.props.status === "RETURNED") {
      throw new Error("Kit already returned");
    }
    if (this.props.status === "CANCELLED") {
      throw new Error("Cannot return cancelled kit checkout");
    }

    this.props.status = "RETURNED";
    this.props.actualReturnDate = new Date();
    this.props.updatedAt = new Date();
  }

  markPartiallyReturned(): void {
    if (this.props.status === "RETURNED") {
      throw new Error("Kit already fully returned");
    }
    if (this.props.status === "CANCELLED") {
      throw new Error("Cannot update cancelled kit checkout");
    }

    this.props.status = "PARTIALLY_RETURNED";
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.props.status === "RETURNED") {
      throw new Error("Cannot cancel returned kit checkout");
    }

    this.props.status = "CANCELLED";
    this.props.updatedAt = new Date();
  }

  extendReturnDate(newDate: Date): void {
    if (
      this.props.status !== "CHECKED_OUT" &&
      this.props.status !== "PARTIALLY_RETURNED"
    ) {
      throw new Error("Can only extend return date for active checkouts");
    }

    if (newDate <= new Date()) {
      throw new Error("New return date must be in the future");
    }

    this.props.expectedReturnDate = newDate;
    this.props.updatedAt = new Date();
  }

  // Status checks
  isCheckedOut(): boolean {
    return this.props.status === "CHECKED_OUT";
  }

  isFullyReturned(): boolean {
    return this.props.status === "RETURNED";
  }

  isPartiallyReturned(): boolean {
    return this.props.status === "PARTIALLY_RETURNED";
  }

  isCancelled(): boolean {
    return this.props.status === "CANCELLED";
  }

  isOverdue(): boolean {
    if (!this.props.expectedReturnDate) {
      return false;
    }
    if (this.props.status === "RETURNED" || this.props.status === "CANCELLED") {
      return false;
    }
    return new Date() > this.props.expectedReturnDate;
  }

  getDaysUntilDue(): number | null {
    if (!this.props.expectedReturnDate) {
      return null;
    }
    const now = new Date();
    const diff = this.props.expectedReturnDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Checkout ID is required");
    }
    if (!this.props.assetKitId) {
      throw new Error("Asset kit ID is required");
    }
    if (!this.props.assigneeId) {
      throw new Error("Assignee ID is required");
    }
    if (!this.props.checkedOutById) {
      throw new Error("Checked out by ID is required");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get assetKitId(): string {
    return this.props.assetKitId;
  }

  get assigneeType(): AssigneeType {
    return this.props.assigneeType;
  }

  get assigneeId(): string {
    return this.props.assigneeId;
  }

  get checkoutDate(): Date {
    return this.props.checkoutDate;
  }

  get expectedReturnDate(): Date | null {
    return this.props.expectedReturnDate;
  }

  get actualReturnDate(): Date | null {
    return this.props.actualReturnDate;
  }

  get status(): KitCheckoutStatus {
    return this.props.status;
  }

  get checkedOutById(): string {
    return this.props.checkedOutById;
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

  toObject(): AssetKitCheckoutProps {
    return { ...this.props };
  }
}
