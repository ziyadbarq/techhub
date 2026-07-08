import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DetectConflictsRequest {
  reservationId: string;
}

export interface DetectConflictsResponse {
  conflictIds: string[];
  conflictCount: number;
}

@injectable()
export class DetectConflictsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
    @inject(DI_TOKENS.IAssetReservationConflictRepository)
    private readonly conflictRepository: IAssetReservationConflictRepository,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: DetectConflictsRequest,
  ): Promise<DetectConflictsResponse> {
    const reservation = await this.reservationRepository.findById(
      request.reservationId,
    );
    if (!reservation) {
      throw new NotFoundError(
        `Reservation with ID ${request.reservationId} not found`,
      );
    }

    // Find all overlapping reservations
    const overlapping =
      await this.reservationRepository.findAssetReservationsOverlapping(
        reservation.assetId,
        reservation.startDate,
        reservation.endDate,
      );

    const conflictIds: string[] = [];

    // Create conflict records for any new overlapping reservations
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
          const created = await this.conflictRepository.create(conflict);
          conflictIds.push(created.id);
        }
      }
    }

    return {
      conflictIds,
      conflictCount: conflictIds.length,
    };
  }
}
