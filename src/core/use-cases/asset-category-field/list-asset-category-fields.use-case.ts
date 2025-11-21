/**
 * List AssetCategoryFields Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import type { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";

export interface ListAssetCategoryFieldsRequest {
  assetCategoryId?: string;
  fieldDefinitionId?: string;
}

@injectable()
export class ListAssetCategoryFieldsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryFieldRepository)
    private fieldRepository: IAssetCategoryFieldRepository,
  ) {}

  async execute(
    request: ListAssetCategoryFieldsRequest,
  ): Promise<AssetCategoryField[]> {
    // Filter by asset category if specified
    if (request.assetCategoryId) {
      return await this.fieldRepository.findByAssetCategoryId(
        request.assetCategoryId,
      );
    }

    // Filter by field definition if specified
    if (request.fieldDefinitionId) {
      return await this.fieldRepository.findByFieldDefinitionId(
        request.fieldDefinitionId,
      );
    }

    // Return all if no filters
    return await this.fieldRepository.findAll();
  }
}
