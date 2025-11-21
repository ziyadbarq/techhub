/**
 * AssetReservationConflict Entity
 *
 * Tracks conflicts between overlapping asset reservations.
 * Used for conflict detection and resolution workflow.
 */

export interface AssetReservationConflictProps {
  id: string;
  reservationId: string;
  conflictingReservationId: string;
  detectedAt: Date;
  resolvedAt: Date | null;
  resolutionNote: string | null;
}

export interface CreateAssetReservationConflictProps {
  reservationId: string;
  conflictingReservationId: string;
}

export class AssetReservationConflict {
  private constructor(private props: AssetReservationConflictProps) {
    this.validate();
  }

  static create(
    props: CreateAssetReservationConflictProps,
  ): AssetReservationConflict {
    if (!props.reservationId?.trim()) {
      throw new Error("Reservation ID is required");
    }
    if (!props.conflictingReservationId?.trim()) {
      throw new Error("Conflicting reservation ID is required");
    }

    if (props.reservationId === props.conflictingReservationId) {
      throw new Error("Reservation cannot conflict with itself");
    }

    return new AssetReservationConflict({
      id: crypto.randomUUID(),
      reservationId: props.reservationId,
      conflictingReservationId: props.conflictingReservationId,
      detectedAt: new Date(),
      resolvedAt: null,
      resolutionNote: null,
    });
  }

  static reconstitute(
    props: AssetReservationConflictProps,
  ): AssetReservationConflict {
    return new AssetReservationConflict(props);
  }

  resolve(resolutionNote: string): void {
    if (this.props.resolvedAt) {
      throw new Error("Conflict already resolved");
    }

    if (!resolutionNote?.trim()) {
      throw new Error("Resolution note is required");
    }

    this.props.resolvedAt = new Date();
    this.props.resolutionNote = resolutionNote.trim();
  }

  isResolved(): boolean {
    return this.props.resolvedAt !== null;
  }

  isUnresolved(): boolean {
    return this.props.resolvedAt === null;
  }

  getAgeInDays(): number {
    const now = new Date();
    const referenceDate = this.props.resolvedAt || now;
    const diff = referenceDate.getTime() - this.props.detectedAt.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Conflict ID is required");
    }
    if (!this.props.reservationId) {
      throw new Error("Reservation ID is required");
    }
    if (!this.props.conflictingReservationId) {
      throw new Error("Conflicting reservation ID is required");
    }

    if (this.props.reservationId === this.props.conflictingReservationId) {
      throw new Error("Reservation cannot conflict with itself");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get reservationId(): string {
    return this.props.reservationId;
  }

  get conflictingReservationId(): string {
    return this.props.conflictingReservationId;
  }

  get detectedAt(): Date {
    return this.props.detectedAt;
  }

  get resolvedAt(): Date | null {
    return this.props.resolvedAt;
  }

  get resolutionNote(): string | null {
    return this.props.resolutionNote;
  }

  toObject(): AssetReservationConflictProps {
    return { ...this.props };
  }
}
