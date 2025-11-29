/**
 * GetAssetStatistics Use Case
 * Business Logic: Retrieve asset statistics for summary cards
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  IAssetRepository,
  AssetSearchOptions,
  AssetStatistics,
} from "@/core/repositories/asset.repository.interface";

@injectable()
export class GetAssetStatisticsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(
    filters?: Omit<
      AssetSearchOptions,
      "limit" | "offset" | "sortBy" | "sortOrder"
    >,
  ): Promise<AssetStatistics> {
    return await this.assetRepository.getStatistics(filters);
  }
}
