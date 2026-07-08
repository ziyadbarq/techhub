/**
 * Update AssetCategory Use Case
 *
 * Business logic for updating an existing asset category.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { AssetCategory } from "@/core/domain/entities/asset-category.entity";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateAssetCategoryProps {
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  lifecycleModelId?: string | null;
}

@injectable()
export class UpdateAssetCategoryUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryRepository)
    private readonly assetCategoryRepository: IAssetCategoryRepository,
  ) {}

  /**
   * Execute update asset category use case
   *
   * @param props - Update properties
   * @returns Updated asset category
   * @throws Error if asset category not found or duplicate code/name
   */
  async execute(props: UpdateAssetCategoryProps): Promise<AssetCategory> {
    // Find existing asset category
    const assetCategory = await this.assetCategoryRepository.findById(props.id);
    if (!assetCategory) {
      throw new NotFoundError(`Asset category with ID "${props.id}" not found`);
    }

    // Check for duplicate code if code is being changed
    if (props.code && props.code !== assetCategory.code) {
      const existsByCode = await this.assetCategoryRepository.existsByCode(
        props.code,
        props.id,
      );
      if (existsByCode) {
        throw new Error(
          `Asset category with code "${props.code}" already exists`,
        );
      }
    }

    // Check for duplicate name if name is being changed
    if (props.name && props.name !== assetCategory.name) {
      const existsByName = await this.assetCategoryRepository.existsByName(
        props.name,
        props.id,
      );
      if (existsByName) {
        throw new Error(
          `Asset category with name "${props.name}" already exists`,
        );
      }
    }

    // Update the asset category
    assetCategory.update({
      code: props.code,
      name: props.name,
      description: props.description,
      lifecycleModelId: props.lifecycleModelId,
    });

    return this.assetCategoryRepository.update(assetCategory);
  }
}
