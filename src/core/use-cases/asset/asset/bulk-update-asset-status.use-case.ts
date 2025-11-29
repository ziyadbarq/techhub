/**
 * BulkUpdateAssetStatus Use Case
 * Business Logic: Update lifecycle state for multiple assets at once
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";

export interface BulkUpdateStatusResult {
  requestedCount: number;
  updatedCount: number;
}

@injectable()
export class BulkUpdateAssetStatusUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(
    ids: string[],
    lifecycleStateId: string,
  ): Promise<BulkUpdateStatusResult> {
    if (ids.length === 0) {
      return {
        requestedCount: 0,
        updatedCount: 0,
      };
    }

    const updatedCount = await this.assetRepository.updateLifecycleStateMany(
      ids,
      lifecycleStateId,
    );

    return {
      requestedCount: ids.length,
      updatedCount,
    };
  }
}
