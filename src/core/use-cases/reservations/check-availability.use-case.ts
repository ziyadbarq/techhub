/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";

export interface CheckAvailabilityRequest {
  assetId: string;
  startDate: Date;
  endDate: Date;
  excludeReservationId?: string;
}

export interface CheckAvailabilityResponse {
  isAvailable: boolean;
  conflictingReservationIds: string[];
}

@injectable()
export class CheckAvailabilityUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
  ) {}

  async execute(
    request: CheckAvailabilityRequest,
  ): Promise<CheckAvailabilityResponse> {
    const overlapping =
      await this.reservationRepository.findAssetReservationsOverlapping(
        request.assetId,
        request.startDate,
        request.endDate,
      );

    // Filter out cancelled reservations and optionally exclude a specific reservation
    const activeOverlapping = overlapping.filter(
      (res) =>
        res.status !== "CANCELLED" &&
        res.status !== "COMPLETED" &&
        (!request.excludeReservationId ||
          res.id !== request.excludeReservationId),
    );

    return {
      isAvailable: activeOverlapping.length === 0,
      conflictingReservationIds: activeOverlapping.map((res) => res.id),
    };
  }
}
