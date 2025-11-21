/**
 * Get AssetCategory Use Case
 *
 * Retrieve a single asset category by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { AssetCategory } from "@/core/domain/entities/asset-category.entity";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";

@injectable()
export class GetAssetCategoryUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryRepository)
    private readonly assetCategoryRepository: IAssetCategoryRepository,
  ) {}

  /**
   * Execute get asset category use case
   *
   * @param id - AssetCategory ID
   * @returns AssetCategory or null if not found
   */
  async execute(id: string): Promise<AssetCategory | null> {
    return this.assetCategoryRepository.findById(id);
  }
}
