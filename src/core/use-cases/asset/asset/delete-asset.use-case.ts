/**
 * DeleteAsset Use Case
 * Business Logic: Delete an asset with dependency checks
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";

@injectable()
export class DeleteAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Check if asset exists
    const asset = await this.assetRepository.findById(id);
    if (!asset) {
      throw new Error(`Asset with ID "${id}" not found`);
    }

    // Business Rule: Cannot delete asset with active assignments
    const hasAssignments = await this.assetRepository.hasAssignments(id);
    if (hasAssignments) {
      throw new Error(
        `Cannot delete asset "${asset.assetTag}". It has active assignments. Please remove all assignments first.`,
      );
    }

    // Business Rule: Cannot delete asset with stock movements
    const hasStockMovements = await this.assetRepository.hasStockMovements(id);
    if (hasStockMovements) {
      throw new Error(
        `Cannot delete asset "${asset.assetTag}". It has stock movement history. Assets with movement history cannot be deleted for audit purposes.`,
      );
    }

    // Delete the asset
    await this.assetRepository.delete(id);
  }
}
