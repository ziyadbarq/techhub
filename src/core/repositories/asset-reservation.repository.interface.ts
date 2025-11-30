import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import type { ReservationStatus } from "@/core/domain/entities/asset-reservation.entity";

export interface IAssetReservationRepository {
  /**
   * Create a new reservation
   */
  create(reservation: AssetReservation): Promise<AssetReservation>;

  /**
   * Find reservation by ID
   */
  findById(id: string): Promise<AssetReservation | null>;

  /**
   * Find all reservations with optional pagination
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "startDate" | "endDate" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetReservation[]>;

  /**
   * Find reservations by asset ID
   */
  findByAssetId(
    assetId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations by status
   */
  findByStatus(
    status: ReservationStatus,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations for a person
   */
  findByPersonId(
    personId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations for an org unit
   */
  findByOrgUnitId(
    orgUnitId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations by reserver (person or org unit)
   */
  findByReserver(
    reserverId: string,
    type: "person" | "orgunit",
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations created by a person
   */
  findByReservedBy(
    reservedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find pending reservations
   */
  findPending(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservation[]>;

  /**
   * Find confirmed reservations
   */
  findConfirmed(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservation[]>;

  /**
   * Find active reservations
   */
  findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservation[]>;

  /**
   * Find upcoming reservations (confirmed, starting soon)
   */
  findUpcoming(
    daysAhead?: number,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations with startDate between the given dates
   */
  findInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations starting within date range
   */
  findStartingInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations overlapping with date range
   */
  findOverlappingWithDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations for asset overlapping with date range (for conflict detection)
   */
  findAssetReservationsOverlapping(
    assetId: string,
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string,
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations confirmed by a person
   */
  findByConfirmedBy(
    confirmedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]>;

  /**
   * Find reservations that should be activated (confirmed and past start date)
   */
  findReadyToActivate(): Promise<AssetReservation[]>;

  /**
   * Find reservations that should be completed (active and past end date)
   */
  findReadyToComplete(): Promise<AssetReservation[]>;

  /**
   * Check if asset has active reservation
   */
  hasActiveReservation(assetId: string): Promise<boolean>;

  /**
   * Check if asset has reservation in date range
   */
  hasReservationInDateRange(
    assetId: string,
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string,
  ): Promise<boolean>;

  /**
   * Update a reservation
   */
  update(reservation: AssetReservation): Promise<AssetReservation>;

  /**
   * Delete a reservation
   */
  delete(id: string): Promise<void>;

  /**
   * Count reservations by status
   */
  countByStatus(status: ReservationStatus): Promise<number>;

  /**
   * Count active reservations
   */
  countActive(): Promise<number>;

  /**
   * Count upcoming reservations
   */
  countUpcoming(daysAhead?: number): Promise<number>;

  /**
   * Count total reservations
   */
  count(): Promise<number>;
}
