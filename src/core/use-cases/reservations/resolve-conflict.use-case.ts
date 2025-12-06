import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import type { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";

export interface ResolveConflictRequest {
  conflictId: string;
  resolutionNote: string;
}

@injectable()
export class ResolveConflictUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationConflictRepository)
    private readonly conflictRepository: IAssetReservationConflictRepository,
  ) {}

  async execute(
    request: ResolveConflictRequest,
  ): Promise<AssetReservationConflict> {
    const conflict = await this.conflictRepository.findById(request.conflictId);
    if (!conflict) {
      throw new Error(`Conflict with ID ${request.conflictId} not found`);
    }

    conflict.resolve(request.resolutionNote);

    return this.conflictRepository.update(conflict);
  }
}
