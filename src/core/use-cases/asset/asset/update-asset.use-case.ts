/**
 * UpdateAsset Use Case
 * Business Logic: Update an existing asset with validation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { Asset } from "@/core/domain/entities/asset.entity";

export interface UpdateAssetInput {
  id: string;
  assetTag?: string;
  assetModelId?: string | null;
  vendorId?: string | null;
  contractId?: string | null;
  lifecycleStateId?: string | null;
  serialNumber?: string | null;
  purchaseDate?: Date | null;
  purchaseCost?: number | null;
  currency?: string | null;
  depreciationModel?: string | null;
  depreciationStart?: Date | null;
  depreciationEnd?: Date | null;
  warrantyEndDate?: Date | null;
  currentStockLocationId?: string | null;
  attributes?: Record<string, unknown> | null;
  note?: string | null;
}

@injectable()
export class UpdateAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(input: UpdateAssetInput): Promise<Asset> {
    // Find existing asset
    const asset = await this.assetRepository.findById(input.id);
    if (!asset) {
      throw new Error(`Asset with ID "${input.id}" not found`);
    }

    // Business Rule: Asset tag must be unique
    if (input.assetTag && input.assetTag !== asset.assetTag) {
      const existingByTag = await this.assetRepository.existsByAssetTag(
        input.assetTag,
        input.id,
      );
      if (existingByTag) {
        throw new Error(
          `Asset tag "${input.assetTag}" already exists. Asset tags must be unique.`,
        );
      }
    }

    // Business Rule: Serial number must be unique if provided
    if (input.serialNumber && input.serialNumber !== asset.serialNumber) {
      const existingBySerial = await this.assetRepository.existsBySerialNumber(
        input.serialNumber,
        input.id,
      );
      if (existingBySerial) {
        throw new Error(
          `Serial number "${input.serialNumber}" already exists. Serial numbers must be unique.`,
        );
      }
    }

    // Update the entity (validation happens in entity method)
    asset.update({
      assetTag: input.assetTag,
      assetModelId: input.assetModelId,
      vendorId: input.vendorId,
      contractId: input.contractId,
      lifecycleStateId: input.lifecycleStateId,
      serialNumber: input.serialNumber,
      purchaseDate: input.purchaseDate,
      purchaseCost: input.purchaseCost,
      currency: input.currency,
      depreciationModel: input.depreciationModel,
      depreciationStart: input.depreciationStart,
      depreciationEnd: input.depreciationEnd,
      warrantyEndDate: input.warrantyEndDate,
      currentStockLocationId: input.currentStockLocationId,
      attributes: input.attributes,
      note: input.note,
    });

    // Persist changes
    return await this.assetRepository.update(asset);
  }
}
