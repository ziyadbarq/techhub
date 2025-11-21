/**
 * Get AssetModel Use Case
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { AssetModel } from "@/core/domain/entities/asset-model.entity";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";

@injectable()
export class GetAssetModelUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetModelRepository)
    private readonly assetModelRepository: IAssetModelRepository,
  ) {}

  async execute(id: string): Promise<AssetModel | null> {
    return this.assetModelRepository.findById(id);
  }
}
