/**
 * BulkDeleteAssets Use Case
 * Business Logic: Delete multiple assets at once
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";

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
  ) {}

  async execute(ids: string[]): Promise<BulkDeleteResult> {
    if (ids.length === 0) {
      return {
        requestedCount: 0,
        deletedCount: 0,
        skippedCount: 0,
      };
    }

    const deletedCount = await this.assetRepository.deleteMany(ids);

    return {
      requestedCount: ids.length,
      deletedCount,
      skippedCount: ids.length - deletedCount,
    };
  }
}
