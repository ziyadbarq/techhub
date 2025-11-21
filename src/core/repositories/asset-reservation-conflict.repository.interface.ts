import type { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";

export interface IAssetReservationConflictRepository {
  /**
   * Create a new conflict
   */
  create(conflict: AssetReservationConflict): Promise<AssetReservationConflict>;

  /**
   * Find conflict by ID
   */
  findById(id: string): Promise<AssetReservationConflict | null>;

  /**
   * Find all conflicts for a reservation
   */
  findByReservationId(
    reservationId: string,
  ): Promise<AssetReservationConflict[]>;

  /**
   * Find conflicts involving a specific reservation (either as primary or conflicting)
   */
  findInvolvingReservation(
    reservationId: string,
  ): Promise<AssetReservationConflict[]>;

  /**
   * Find unresolved conflicts
   */
  findUnresolved(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservationConflict[]>;

  /**
   * Find resolved conflicts
   */
  findResolved(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservationConflict[]>;

  /**
   * Find conflicts resolved within date range
   */
  findResolvedInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservationConflict[]>;

  /**
   * Find conflicts detected within date range
   */
  findDetectedInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservationConflict[]>;

  /**
   * Check if conflict exists between two reservations
   */
  conflictExists(
    reservationId: string,
    conflictingReservationId: string,
  ): Promise<boolean>;

  /**
   * Check if reservation has unresolved conflicts
   */
  hasUnresolvedConflicts(reservationId: string): Promise<boolean>;

  /**
   * Update a conflict
   */
  update(conflict: AssetReservationConflict): Promise<AssetReservationConflict>;

  /**
   * Delete a conflict
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all conflicts for a reservation
   */
  deleteByReservationId(reservationId: string): Promise<void>;

  /**
   * Count unresolved conflicts
   */
  countUnresolved(): Promise<number>;

  /**
   * Count conflicts for a reservation
   */
  countByReservationId(reservationId: string): Promise<number>;

  /**
   * Count unresolved conflicts for a reservation
   */
  countUnresolvedByReservationId(reservationId: string): Promise<number>;
}
