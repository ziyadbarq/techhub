/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface ActivateReadyReservationsResponse {
  activatedIds: string[];
  activatedCount: number;
}

/**
 * Background job use case that automatically activates reservations
 * that have reached their start date
 */
@injectable()
export class ActivateReadyReservationsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(): Promise<ActivateReadyReservationsResponse> {
    const readyReservations =
      await this.reservationRepository.findReadyToActivate();
    const activatedIds: string[] = [];

    for (const reservation of readyReservations) {
      try {
        reservation.start();
        await this.reservationRepository.update(reservation);
        activatedIds.push(reservation.id);
      } catch (error) {
        // Log error but continue with other reservations
        this.logger.error("Failed to activate reservation", {
          reservationId: reservation.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      activatedIds,
      activatedCount: activatedIds.length,
    };
  }
}
