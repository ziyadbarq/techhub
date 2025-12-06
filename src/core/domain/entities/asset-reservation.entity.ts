/**
 * AssetReservation Entity
 *
 * Represents a reservation of an asset for future use.
 * Manages reservation lifecycle from pending to confirmed to active to completed.
 * Supports conflict detection and resolution.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export interface AssetReservationProps {
  id: string;
  assetId: string;
  reservedForPersonId: string | null;
  reservedForOrgUnitId: string | null;
  reservedById: string;
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  purpose: string | null;
  note: string | null;
  confirmationDate: Date | null;
  confirmedById: string | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  cancelledById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetReservationProps {
  assetId: string;
  reservedForPersonId?: string | null;
  reservedForOrgUnitId?: string | null;
  reservedById: string;
  startDate: Date;
  endDate: Date;
  purpose?: string | null;
  note?: string | null;
}

export class AssetReservation {
  private constructor(private props: AssetReservationProps) {
    this.validate();
  }

  static create(
    props: CreateAssetReservationProps,
    idGenerator: IIdGenerator,
  ): AssetReservation {
    if (!props.assetId?.trim()) {
      throw new Error("Asset ID is required");
    }
    if (!props.reservedById?.trim()) {
      throw new Error("Reserved by ID is required");
    }

    // Validate that exactly one of person or org unit is specified
    const hasPersonId = !!props.reservedForPersonId?.trim();
    const hasOrgUnitId = !!props.reservedForOrgUnitId?.trim();

    if (!hasPersonId && !hasOrgUnitId) {
      throw new Error(
        "Either reserved for person or org unit must be specified",
      );
    }
    if (hasPersonId && hasOrgUnitId) {
      throw new Error("Cannot reserve for both person and org unit");
    }

    // Validate date range
    if (props.endDate <= props.startDate) {
      throw new Error("End date must be after start date");
    }

    const now = new Date();

    return new AssetReservation({
      id: idGenerator.generateId(),
      assetId: props.assetId,
      reservedForPersonId: props.reservedForPersonId?.trim() || null,
      reservedForOrgUnitId: props.reservedForOrgUnitId?.trim() || null,
      reservedById: props.reservedById,
      startDate: props.startDate,
      endDate: props.endDate,
      status: "PENDING",
      purpose: props.purpose?.trim() || null,
      note: props.note?.trim() || null,
      confirmationDate: null,
      confirmedById: null,
      cancellationReason: null,
      cancelledAt: null,
      cancelledById: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AssetReservationProps): AssetReservation {
    return new AssetReservation(props);
  }

  // Workflow methods
  confirm(confirmedById: string): void {
    if (this.props.status !== "PENDING") {
      throw new Error("Can only confirm pending reservations");
    }

    this.props.status = "CONFIRMED";
    this.props.confirmationDate = new Date();
    this.props.confirmedById = confirmedById;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status !== "CONFIRMED") {
      throw new Error("Can only activate confirmed reservations");
    }

    const now = new Date();
    if (now < this.props.startDate) {
      throw new Error("Cannot activate reservation before start date");
    }

    this.props.status = "ACTIVE";
    this.props.updatedAt = new Date();
  }

  complete(): void {
    if (this.props.status !== "ACTIVE") {
      throw new Error("Can only complete active reservations");
    }

    this.props.status = "COMPLETED";
    this.props.updatedAt = new Date();
  }

  cancel(cancelledById: string, reason: string): void {
    if (this.props.status === "COMPLETED") {
      throw new Error("Cannot cancel completed reservation");
    }
    if (this.props.status === "CANCELLED") {
      throw new Error("Reservation already cancelled");
    }

    if (!reason?.trim()) {
      throw new Error("Cancellation reason is required");
    }

    this.props.status = "CANCELLED";
    this.props.cancellationReason = reason.trim();
    this.props.cancelledAt = new Date();
    this.props.cancelledById = cancelledById;
    this.props.updatedAt = new Date();
  }

  extendEndDate(newEndDate: Date): void {
    if (this.props.status !== "CONFIRMED" && this.props.status !== "ACTIVE") {
      throw new Error("Can only extend confirmed or active reservations");
    }

    if (newEndDate <= this.props.endDate) {
      throw new Error("New end date must be after current end date");
    }

    this.props.endDate = newEndDate;
    this.props.updatedAt = new Date();
  }

  updateNote(note: string): void {
    this.props.note = note?.trim() || null;
    this.props.updatedAt = new Date();
  }

  // Status checks
  isPending(): boolean {
    return this.props.status === "PENDING";
  }

  isConfirmed(): boolean {
    return this.props.status === "CONFIRMED";
  }

  isActive(): boolean {
    return this.props.status === "ACTIVE";
  }

  isCompleted(): boolean {
    return this.props.status === "COMPLETED";
  }

  isCancelled(): boolean {
    return this.props.status === "CANCELLED";
  }

  canBeConfirmed(): boolean {
    return this.props.status === "PENDING";
  }

  canBeActivated(): boolean {
    return (
      this.props.status === "CONFIRMED" && new Date() >= this.props.startDate
    );
  }

  canBeCompleted(): boolean {
    return this.props.status === "ACTIVE";
  }

  isReservedForPerson(): boolean {
    return this.props.reservedForPersonId !== null;
  }

  isReservedForOrgUnit(): boolean {
    return this.props.reservedForOrgUnitId !== null;
  }

  // Date utilities
  isUpcoming(): boolean {
    return (
      (this.props.status === "PENDING" || this.props.status === "CONFIRMED") &&
      new Date() < this.props.startDate
    );
  }

  isCurrent(): boolean {
    const now = new Date();
    return (
      this.props.status === "ACTIVE" &&
      now >= this.props.startDate &&
      now <= this.props.endDate
    );
  }

  isPast(): boolean {
    return (
      this.props.status === "COMPLETED" ||
      (this.props.status === "CANCELLED" && new Date() > this.props.endDate)
    );
  }

  getDurationDays(): number {
    const diff = this.props.endDate.getTime() - this.props.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getDaysUntilStart(): number {
    const now = new Date();
    const diff = this.props.startDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getDaysUntilEnd(): number {
    const now = new Date();
    const diff = this.props.endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  overlapsWithDates(startDate: Date, endDate: Date): boolean {
    // Check if this reservation overlaps with the given date range
    return this.props.startDate < endDate && this.props.endDate > startDate;
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Reservation ID is required");
    }
    if (!this.props.assetId) {
      throw new Error("Asset ID is required");
    }
    if (!this.props.reservedById) {
      throw new Error("Reserved by ID is required");
    }

    // Validate that exactly one of person or org unit is specified
    const hasPersonId = !!this.props.reservedForPersonId;
    const hasOrgUnitId = !!this.props.reservedForOrgUnitId;

    if (!hasPersonId && !hasOrgUnitId) {
      throw new Error(
        "Either reserved for person or org unit must be specified",
      );
    }
    if (hasPersonId && hasOrgUnitId) {
      throw new Error("Cannot reserve for both person and org unit");
    }

    // Validate date range
    if (this.props.endDate <= this.props.startDate) {
      throw new Error("End date must be after start date");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get assetId(): string {
    return this.props.assetId;
  }

  get reservedForPersonId(): string | null {
    return this.props.reservedForPersonId;
  }

  get reservedForOrgUnitId(): string | null {
    return this.props.reservedForOrgUnitId;
  }

  get reservedById(): string {
    return this.props.reservedById;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get status(): ReservationStatus {
    return this.props.status;
  }

  get purpose(): string | null {
    return this.props.purpose;
  }

  get note(): string | null {
    return this.props.note;
  }

  get confirmationDate(): Date | null {
    return this.props.confirmationDate;
  }

  get confirmedById(): string | null {
    return this.props.confirmedById;
  }

  get cancellationReason(): string | null {
    return this.props.cancellationReason;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get cancelledById(): string | null {
    return this.props.cancelledById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toObject(): AssetReservationProps {
    return { ...this.props };
  }
}
