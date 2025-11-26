/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import type { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";
import type { AssetReservationConflictDTO } from "../dtos/generated/asset-reservation-conflict.dto";

export class AssetReservationConflictPresenter {
  static toDTO(
    conflict: AssetReservationConflict,
  ): AssetReservationConflictDTO {
    return {
      id: conflict.id,
      reservationId: conflict.reservationId,
      conflictingReservationId: conflict.conflictingReservationId,
      detectedAt: conflict.detectedAt,
      resolvedAt: conflict.resolvedAt,
      resolutionNote: conflict.resolutionNote,
    };
  }

  static toDTOList(
    conflicts: AssetReservationConflict[],
  ): AssetReservationConflictDTO[] {
    return conflicts.map((conflict) => this.toDTO(conflict));
  }
}
