/**
 * BulkDeleteAssets Use Case
 * Business Logic: Delete multiple assets at once
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IAssetDependencyRepository } from "@/core/repositories/asset-dependency.repository.interface";

export interface BulkDeleteResult {
  requestedCount: number;
  deletedCount: number;
  skippedCount: number;
}

@injectable()
export class BulkDeleteAssetsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.IAssetDependencyRepository)
    private readonly dependencyRepository: IAssetDependencyRepository,
  ) {}

  async execute(ids: string[]): Promise<BulkDeleteResult> {
    if (ids.length === 0) {
      return {
        requestedCount: 0,
        deletedCount: 0,
        skippedCount: 0,
      };
    }

    let deletedCount = 0;

    for (const id of ids) {
      const asset = await this.assetRepository.findById(id);
      if (!asset) {
        continue;
      }

      const [
        activeAssignments,
        activeReservations,
        activeDisposals,
        activeKitCheckouts,
        dependencies,
      ] = await Promise.all([
        this.dependencyRepository.countActiveAssignments(id),
        this.dependencyRepository.countActiveReservations(id),
        this.dependencyRepository.countActiveDisposals(id),
        this.dependencyRepository.countActiveKitCheckouts(id),
        this.dependencyRepository.getDependencies(id),
      ]);

      const hasBlockers =
        activeAssignments > 0 ||
        activeReservations > 0 ||
        activeDisposals > 0 ||
        activeKitCheckouts > 0 ||
        dependencies.configurationItems > 0;

      if (hasBlockers) {
        continue;
      }

      await this.assetRepository.updateSoftDelete(id);
      deletedCount += 1;
    }

    return {
      requestedCount: ids.length,
      deletedCount,
      skippedCount: ids.length - deletedCount,
    };
  }
}
