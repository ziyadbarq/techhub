/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";

export interface CompleteReservationRequest {
  reservationId: string;
  actualReturnDate?: Date;
}

@injectable()
export class CompleteReservationUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
  ) {}

  async execute(
    request: CompleteReservationRequest,
  ): Promise<AssetReservation> {
    const reservation = await this.reservationRepository.findById(
      request.reservationId,
    );
    if (!reservation) {
      throw new Error(`Reservation with ID ${request.reservationId} not found`);
    }

    const returnDate = request.actualReturnDate || new Date();
    reservation.complete(returnDate);

    return this.reservationRepository.update(reservation);
  }
}
