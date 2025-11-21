/**
 * GetAsset Use Case
 * Business Logic: Retrieve a single asset by ID
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { Asset } from "@/core/domain/entities/asset.entity";

@injectable()
export class GetAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(id: string): Promise<Asset | null> {
    return await this.assetRepository.findById(id);
  }
}
