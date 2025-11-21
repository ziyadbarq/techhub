/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";

export interface CreateReservationRequest {
  assetId: string;
  reservedByPersonId?: string;
  reservedByOrgUnitId?: string;
  startDate: Date;
  endDate: Date;
  purpose?: string;
  notes?: string;
}

@injectable()
export class CreateReservationUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
    @inject(DI_TOKENS.IAssetReservationConflictRepository)
    private readonly conflictRepository: IAssetReservationConflictRepository,
  ) {}

  async execute(request: CreateReservationRequest): Promise<AssetReservation> {
    // Create the reservation
    const reservation = AssetReservation.create({
      assetId: request.assetId,
      reservedByPersonId: request.reservedByPersonId,
      reservedByOrgUnitId: request.reservedByOrgUnitId,
      startDate: request.startDate,
      endDate: request.endDate,
      purpose: request.purpose,
      notes: request.notes,
    });

    const createdReservation =
      await this.reservationRepository.create(reservation);

    // Check for conflicts with existing reservations
    const overlapping =
      await this.reservationRepository.findAssetReservationsOverlapping(
        request.assetId,
        request.startDate,
        request.endDate,
      );

    // Create conflict records for any overlapping reservations
    for (const existingReservation of overlapping) {
      if (existingReservation.id !== createdReservation.id) {
        const conflict = AssetReservationConflict.create({
          reservationId: createdReservation.id,
          conflictingReservationId: existingReservation.id,
        });
        await this.conflictRepository.create(conflict);
      }
    }

    return createdReservation;
  }
}
