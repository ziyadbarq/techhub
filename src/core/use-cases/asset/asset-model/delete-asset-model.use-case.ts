/**
 * Delete AssetModel Use Case
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class DeleteAssetModelUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetModelRepository)
    private readonly assetModelRepository: IAssetModelRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const assetModel = await this.assetModelRepository.findById(id);
    if (!assetModel) {
      throw new NotFoundError(`Asset model with ID "${id}" not found`);
    }

    const hasAssets = await this.assetModelRepository.hasAssets(id);

    if (!assetModel.canBeDeleted(hasAssets)) {
      throw new ValidationError(
        `Cannot delete asset model "${assetModel.name}" because it has assets. Remove them first.`,
      );
    }

    await this.assetModelRepository.delete(id);
  }
}
