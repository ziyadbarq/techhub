/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";

export interface ListAvailableAssetsRequest {
  assetIds: string[];
  startDate: Date;
  endDate: Date;
}

export interface ListAvailableAssetsResponse {
  availableAssetIds: string[];
  unavailableAssetIds: string[];
}

@injectable()
export class ListAvailableAssetsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
  ) {}

  async execute(
    request: ListAvailableAssetsRequest,
  ): Promise<ListAvailableAssetsResponse> {
    const availableAssetIds: string[] = [];
    const unavailableAssetIds: string[] = [];

    for (const assetId of request.assetIds) {
      const hasReservation =
        await this.reservationRepository.hasReservationInDateRange(
          assetId,
          request.startDate,
          request.endDate,
        );

      if (hasReservation) {
        unavailableAssetIds.push(assetId);
      } else {
        availableAssetIds.push(assetId);
      }
    }

    return {
      availableAssetIds,
      unavailableAssetIds,
    };
  }
}
