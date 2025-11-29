/**
 * List AssetCategories Use Case
 *
 * Retrieve all asset categories with optional filtering and pagination.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { AssetCategory } from "@/core/domain/entities/asset-category.entity";
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";

export interface ListAssetCategoriesOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "code" | "createdAt";
  order?: "asc" | "desc";
  search?: string;
}

@injectable()
export class ListAssetCategoriesUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryRepository)
    private readonly assetCategoryRepository: IAssetCategoryRepository,
  ) {}

  /**
   * Execute list asset categories use case
   *
   * @param options - Query options
   * @returns List of asset categories
   */
  async execute(
    options?: ListAssetCategoriesOptions,
  ): Promise<AssetCategory[]> {
    // If search query provided, use search
    if (options?.search) {
      return this.assetCategoryRepository.search(options.search, {
        skip: options.skip,
        take: options.take,
      });
    }

    // Otherwise, list all with filters
    return this.assetCategoryRepository.findAll({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
      order: options?.order,
    });
  }
}
