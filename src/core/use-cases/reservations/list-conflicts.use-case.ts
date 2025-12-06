import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import type { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";

export interface ListConflictsRequest {
  reservationId?: string;
  unresolvedOnly?: boolean;
}

export interface ListConflictsResponse {
  conflicts: AssetReservationConflict[];
  total: number;
}

@injectable()
export class ListConflictsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationConflictRepository)
    private readonly conflictRepository: IAssetReservationConflictRepository,
  ) {}

  async execute(request: ListConflictsRequest): Promise<ListConflictsResponse> {
    let conflicts: AssetReservationConflict[];

    if (request.reservationId) {
      conflicts = await this.conflictRepository.findInvolvingReservation(
        request.reservationId,
      );
      // Filter by resolution status if specified
      if (request.unresolvedOnly) {
        conflicts = conflicts.filter(
          (conflict) => conflict.resolvedAt === null,
        );
      }
    } else if (request.unresolvedOnly) {
      conflicts = await this.conflictRepository.findUnresolved();
    } else {
      // Get both resolved and unresolved
      const unresolved = await this.conflictRepository.findUnresolved();
      const resolved = await this.conflictRepository.findResolved();
      conflicts = [...unresolved, ...resolved];
    }

    return {
      conflicts,
      total: conflicts.length,
    };
  }
}
