/**
 * ListAssets Use Case
 * Business Logic: Retrieve a list of assets with optional filtering
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  IAssetRepository,
  AssetSearchOptions,
} from "@/core/repositories/asset.repository.interface";
import type { Asset } from "@/core/domain/entities/asset.entity";

@injectable()
export class ListAssetsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(options?: AssetSearchOptions): Promise<Asset[]> {
    if (options && Object.keys(options).length > 0) {
      return await this.assetRepository.search(options);
    }

    return await this.assetRepository.findAll();
  }
}
