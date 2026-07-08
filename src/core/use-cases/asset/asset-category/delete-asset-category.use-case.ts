/**
 * Delete AssetCategory Use Case
 *
 * Business logic for deleting an asset category.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class DeleteAssetCategoryUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryRepository)
    private readonly assetCategoryRepository: IAssetCategoryRepository,
  ) {}

  /**
   * Execute delete asset category use case
   *
   * @param id - AssetCategory ID
   * @throws Error if asset category not found or cannot be deleted
   */
  async execute(id: string): Promise<void> {
    // Find existing asset category
    const assetCategory = await this.assetCategoryRepository.findById(id);
    if (!assetCategory) {
      throw new NotFoundError(`Asset category with ID "${id}" not found`);
    }

    // Check if can be deleted (no asset models or assets)
    const hasAssetModels =
      await this.assetCategoryRepository.hasAssetModels(id);
    const hasAssets = await this.assetCategoryRepository.hasAssets(id);

    if (!assetCategory.canBeDeleted(hasAssetModels, hasAssets)) {
      const reasons = [];
      if (hasAssetModels) reasons.push("asset models");
      if (hasAssets) reasons.push("assets");

      throw new ValidationError(
        `Cannot delete asset category "${assetCategory.name}" because it has ${reasons.join(" and ")}. Remove them first.`,
      );
    }

    await this.assetCategoryRepository.delete(id);
  }
}
