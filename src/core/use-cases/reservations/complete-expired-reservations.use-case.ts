/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";

export interface CompleteExpiredReservationsResponse {
  completedIds: string[];
  completedCount: number;
}

/**
 * Background job use case that automatically completes reservations
 * that have passed their end date
 */
@injectable()
export class CompleteExpiredReservationsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
  ) {}

  async execute(): Promise<CompleteExpiredReservationsResponse> {
    const expiredReservations =
      await this.reservationRepository.findReadyToComplete();
    const completedIds: string[] = [];

    for (const reservation of expiredReservations) {
      try {
        reservation.complete(new Date());
        await this.reservationRepository.update(reservation);
        completedIds.push(reservation.id);
      } catch (error) {
        // Log error but continue with other reservations
        console.error(
          `Failed to complete reservation ${reservation.id}:`,
          error,
        );
      }
    }

    return {
      completedIds,
      completedCount: completedIds.length,
    };
  }
}
