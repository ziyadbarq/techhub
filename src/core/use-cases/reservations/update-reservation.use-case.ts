import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateReservationRequest {
  reservationId: string;
  endDate?: Date; // Can only extend end date
  notes?: string;
}

@injectable()
export class UpdateReservationUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
    @inject(DI_TOKENS.IAssetReservationConflictRepository)
    private readonly conflictRepository: IAssetReservationConflictRepository,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(request: UpdateReservationRequest): Promise<AssetReservation> {
    const reservation = await this.reservationRepository.findById(
      request.reservationId,
    );
    if (!reservation) {
      throw new NotFoundError(
        `Reservation with ID ${request.reservationId} not found`,
      );
    }

    let datesChanged = false;

    if (request.endDate !== undefined) {
      reservation.extendEndDate(request.endDate);
      datesChanged = true;
    }

    if (request.notes !== undefined) {
      reservation.updateNote(request.notes);
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
            const conflict = AssetReservationConflict.create(
              {
                reservationId: reservation.id,
                conflictingReservationId: existingReservation.id,
              },
              this.idGenerator,
            );
            await this.conflictRepository.create(conflict);
          }
        }
      }
    }

    return updatedReservation;
  }
}
