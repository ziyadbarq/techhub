/**
 * ListAssetsPaginated Use Case
 * Business Logic: Retrieve a paginated list of assets with filtering
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  IAssetRepository,
  AssetSearchOptions,
  PaginatedResult,
} from "@/core/repositories/asset.repository.interface";
import type { Asset } from "@/core/domain/entities/asset.entity";

@injectable()
export class ListAssetsPaginatedUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(options?: AssetSearchOptions): Promise<PaginatedResult<Asset>> {
    const searchOptions: AssetSearchOptions = {
      limit: 20,
      offset: 0,
      ...options,
    };

    return await this.assetRepository.searchPaginated(searchOptions);
  }
}
