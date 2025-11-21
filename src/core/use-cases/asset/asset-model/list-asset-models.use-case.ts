/**
 * List AssetModels Use Case
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { AssetModel } from "@/core/domain/entities/asset-model.entity";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";

export interface ListAssetModelsOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "code" | "createdAt";
  order?: "asc" | "desc";
  search?: string;
  assetCategoryId?: string;
  vendorId?: string;
}

@injectable()
export class ListAssetModelsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetModelRepository)
    private readonly assetModelRepository: IAssetModelRepository,
  ) {}

  async execute(options?: ListAssetModelsOptions): Promise<AssetModel[]> {
    if (options?.search) {
      return this.assetModelRepository.search(options.search, {
        skip: options.skip,
        take: options.take,
        assetCategoryId: options.assetCategoryId,
        vendorId: options.vendorId,
      });
    }

    return this.assetModelRepository.findAll({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
      order: options?.order,
    });
  }
}
