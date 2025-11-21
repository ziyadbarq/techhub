/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";

export interface UpdateReservationRequest {
  reservationId: string;
  startDate?: Date;
  endDate?: Date;
  purpose?: string;
  notes?: string;
}

@injectable()
export class UpdateReservationUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
    @inject(DI_TOKENS.IAssetReservationConflictRepository)
    private readonly conflictRepository: IAssetReservationConflictRepository,
  ) {}

  async execute(request: UpdateReservationRequest): Promise<AssetReservation> {
    const reservation = await this.reservationRepository.findById(
      request.reservationId,
    );
    if (!reservation) {
      throw new Error(`Reservation with ID ${request.reservationId} not found`);
    }

    if (reservation.status === "ACTIVE" || reservation.status === "COMPLETED") {
      throw new Error("Cannot update active or completed reservations");
    }

    let datesChanged = false;

    if (request.startDate !== undefined) {
      reservation.updateStartDate(request.startDate);
      datesChanged = true;
    }

    if (request.endDate !== undefined) {
      reservation.updateEndDate(request.endDate);
      datesChanged = true;
    }

    if (request.purpose !== undefined) {
      reservation.updatePurpose(request.purpose);
    }

    if (request.notes !== undefined) {
      reservation.updateNotes(request.notes);
    }

    const updatedReservation =
      await this.reservationRepository.update(reservation);

    // If dates changed, re-check for conflicts
    if (datesChanged) {
      const overlapping =
        await this.reservationRepository.findAssetReservationsOverlapping(
          reservation.assetId,
          reservation.startDate,
          reservation.endDate,
        );

      for (const existingReservation of overlapping) {
        if (existingReservation.id !== reservation.id) {
          const conflictExists = await this.conflictRepository.conflictExists(
            reservation.id,
            existingReservation.id,
          );

          if (!conflictExists) {
            const conflict = AssetReservationConflict.create({
              reservationId: reservation.id,
              conflictingReservationId: existingReservation.id,
            });
            await this.conflictRepository.create(conflict);
          }
        }
      }
    }

    return updatedReservation;
  }
}
