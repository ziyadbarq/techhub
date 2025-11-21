/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";

export interface ListReservationsRequest {
  assetId?: string;
  reservedByPersonId?: string;
  reservedByOrgUnitId?: string;
  status?: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate?: Date;
  endDate?: Date;
}

export interface ListReservationsResponse {
  reservations: AssetReservation[];
  total: number;
}

@injectable()
export class ListReservationsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
  ) {}

  async execute(
    request: ListReservationsRequest,
  ): Promise<ListReservationsResponse> {
    let reservations: AssetReservation[];

    if (request.assetId) {
      reservations = await this.reservationRepository.findByAssetId(
        request.assetId,
      );
    } else if (request.reservedByPersonId) {
      reservations = await this.reservationRepository.findByReserver(
        request.reservedByPersonId,
        "person",
      );
    } else if (request.reservedByOrgUnitId) {
      reservations = await this.reservationRepository.findByReserver(
        request.reservedByOrgUnitId,
        "orgunit",
      );
    } else if (request.startDate && request.endDate) {
      reservations = await this.reservationRepository.findInDateRange(
        request.startDate,
        request.endDate,
      );
    } else {
      reservations = await this.reservationRepository.findAll();
    }

    // Filter by status if specified
    if (request.status) {
      reservations = reservations.filter(
        (res) => res.status === request.status,
      );
    }

    return {
      reservations,
      total: reservations.length,
    };
  }
}
