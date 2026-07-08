/**
 * Update AssetCategoryField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import type { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateAssetCategoryFieldRequest {
  id: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  defaultValue?: Record<string, unknown> | null;
  uiOrder?: number;
}

@injectable()
export class UpdateAssetCategoryFieldUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryFieldRepository)
    private fieldRepository: IAssetCategoryFieldRepository,
  ) {}

  async execute(
    request: UpdateAssetCategoryFieldRequest,
  ): Promise<AssetCategoryField> {
    const field = await this.fieldRepository.findById(request.id);

    if (!field) {
      throw new NotFoundError("Asset category field not found");
    }

    field.update({
      isRequired: request.isRequired,
      isUnique: request.isUnique,
      isVisible: request.isVisible,
      defaultValue: request.defaultValue,
      uiOrder: request.uiOrder,
    });

    return await this.fieldRepository.update(field);
  }
}
