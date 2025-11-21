/**
 * Create AssetCategory Use Case
 *
 * Business logic for creating a new asset category.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { AssetCategory } from "@/core/domain/entities/asset-category.entity";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";

export interface CreateAssetCategoryProps {
  code: string;
  name: string;
  description?: string;
  lifecycleModelId?: string | null;
  isConsumable?: boolean;
}

@injectable()
export class CreateAssetCategoryUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryRepository)
    private readonly assetCategoryRepository: IAssetCategoryRepository,
  ) {}

  /**
   * Execute create asset category use case
   *
   * @param props - AssetCategory creation properties
   * @returns Created asset category
   * @throws Error if code or name already exists
   */
  async execute(props: CreateAssetCategoryProps): Promise<AssetCategory> {
    // Check for duplicate code
    const existsByCode = await this.assetCategoryRepository.existsByCode(
      props.code,
    );
    if (existsByCode) {
      throw new Error(
        `Asset category with code "${props.code}" already exists`,
      );
    }

    // Check for duplicate name
    const existsByName = await this.assetCategoryRepository.existsByName(
      props.name,
    );
    if (existsByName) {
      throw new Error(
        `Asset category with name "${props.name}" already exists`,
      );
    }

    const assetCategory = AssetCategory.create(props);
    const created = await this.assetCategoryRepository.create(assetCategory);
    return created;
  }
}
