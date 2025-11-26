/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import type { AssetReservationDTO } from "../dtos/generated/asset-reservation.dto";

export interface AssetReservationEnrichment {
  assetTag?: string;
  personName?: string;
}

export class AssetReservationPresenter {
  static toDTO(
    reservation: AssetReservation,
    enrichment?: AssetReservationEnrichment,
  ): AssetReservationDTO {
    return {
      id: reservation.id,
      assetId: reservation.assetId,
      reservedByPersonId: reservation.reservedByPersonId,
      reservedByOrgUnitId: reservation.reservedByOrgUnitId,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      status: reservation.status,
      purpose: reservation.purpose,
      notes: reservation.notes,
      confirmationDate: reservation.confirmationDate,
      confirmedById: reservation.confirmedById,
      actualStartDate: reservation.actualStartDate,
      actualEndDate: reservation.actualEndDate,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      // Display fields
      assetTag: enrichment?.assetTag,
      personName: enrichment?.personName,
    };
  }

  static toDTOList(
    reservations: AssetReservation[],
    enrichmentMap?: Map<string, AssetReservationEnrichment>,
  ): AssetReservationDTO[] {
    return reservations.map((reservation) =>
      this.toDTO(reservation, enrichmentMap?.get(reservation.id)),
    );
  }
}
