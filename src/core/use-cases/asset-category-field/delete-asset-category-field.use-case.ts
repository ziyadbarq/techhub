/**
 * Delete AssetCategoryField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteAssetCategoryFieldRequest {
  id: string;
}

@injectable()
export class DeleteAssetCategoryFieldUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetCategoryFieldRepository)
    private fieldRepository: IAssetCategoryFieldRepository,
  ) {}

  async execute(request: DeleteAssetCategoryFieldRequest): Promise<void> {
    const field = await this.fieldRepository.findById(request.id);

    if (!field) {
      throw new NotFoundError("Asset category field not found");
    }

    await this.fieldRepository.delete(request.id);
  }
}
