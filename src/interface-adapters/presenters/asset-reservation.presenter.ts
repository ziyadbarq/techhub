import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import type { AssetReservationDTO } from "../dtos/generated/asset-reservation.dto";

export interface AssetReservationEnrichment {
  assetTag?: string;
  personName?: string;
}

/**
 * Converts an AssetReservation entity to a DTO with optional enrichment data
 */
export function presentAssetReservation(
  reservation: AssetReservation,
  enrichment?: AssetReservationEnrichment,
): AssetReservationDTO {
  const now = new Date();
  const isExpired =
    reservation.endDate < now &&
    reservation.status !== "COMPLETED" &&
    reservation.status !== "CANCELLED";
  const daysRemaining = Math.ceil(
    (reservation.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isReadyToStart =
    reservation.status === "CONFIRMED" &&
    reservation.startDate <= now &&
    !isExpired;
  const isOverdue =
    reservation.status === "ACTIVE" && reservation.endDate < now;

  return {
    id: reservation.id,
    assetId: reservation.assetId,
    reservedForPersonId: reservation.reservedForPersonId,
    reservedForOrgUnitId: reservation.reservedForOrgUnitId,
    reservedById: reservation.reservedById,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    status: reservation.status,
    purpose: reservation.purpose,
    notes: reservation.note,
    confirmationDate: reservation.confirmationDate,
    confirmedById: reservation.confirmedById,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    // Display fields (enriched from relations)
    assetTag: enrichment?.assetTag,
    personName: enrichment?.personName,
    // Computed fields
    isExpired,
    daysRemaining,
    isReadyToStart,
    isOverdue,
  };
}

/**
 * Converts an array of AssetReservation entities to DTOs without enrichment
 * For enriched presentation, use presentAssetReservation individually
 */
export function presentAssetReservations(
  reservations: AssetReservation[],
): AssetReservationDTO[] {
  return reservations.map((reservation) =>
    presentAssetReservation(reservation),
  );
}

/**
 * Converts an array of AssetReservation entities to DTOs with enrichment map
 */
export function presentAssetReservationsWithEnrichment(
  reservations: AssetReservation[],
  enrichmentMap: Map<string, AssetReservationEnrichment>,
): AssetReservationDTO[] {
  return reservations.map((reservation) =>
    presentAssetReservation(reservation, enrichmentMap.get(reservation.id)),
  );
}
