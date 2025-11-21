/**
 * Get AssetCategoryField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import type { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";

export interface GetAssetCategoryFieldRequest {
  id: string;
}

@injectable()
export class GetAssetCategoryFieldUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryFieldRepository)
    private fieldRepository: IAssetCategoryFieldRepository,
  ) {}

  async execute(
    request: GetAssetCategoryFieldRequest,
  ): Promise<AssetCategoryField> {
    const field = await this.fieldRepository.findById(request.id);

    if (!field) {
      throw new Error("Asset category field not found");
    }

    return field;
  }
}
