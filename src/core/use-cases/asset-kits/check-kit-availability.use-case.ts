/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";

export interface CheckKitAvailabilityRequest {
  kitId: string;
  startDate: Date;
  endDate: Date;
}

export interface CheckKitAvailabilityResponse {
  isAvailable: boolean;
  requiredQuantity: number;
  availableQuantity: number;
  unavailableCategories: Array<{
    categoryId: string;
    required: number;
    available: number;
  }>;
}

@injectable()
export class CheckKitAvailabilityUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitRepository)
    private readonly assetKitRepository: IAssetKitRepository,
    @inject(DI_TOKENS.IAssetKitItemRepository)
    private readonly kitItemRepository: IAssetKitItemRepository,
    @inject(DI_TOKENS.IAssetKitCheckoutItemRepository)
    private readonly checkoutItemRepository: IAssetKitCheckoutItemRepository,
  ) {}

  async execute(
    request: CheckKitAvailabilityRequest,
  ): Promise<CheckKitAvailabilityResponse> {
    const kit = await this.assetKitRepository.findById(request.kitId);
    if (!kit) {
      throw new Error(`Asset kit with ID ${request.kitId} not found`);
    }

    const kitItems = await this.kitItemRepository.findByKitId(request.kitId);
    const unavailableCategories: Array<{
      categoryId: string;
      required: number;
      available: number;
    }> = [];

    let totalRequired = 0;
    let totalAvailable = 0;

    for (const kitItem of kitItems) {
      totalRequired += kitItem.quantity;

      // For now, we'll assume all required assets are available
      // In a full implementation, you would check actual asset availability
      // against existing checkouts for the date range
      const available = kitItem.quantity;
      totalAvailable += available;

      if (available < kitItem.quantity) {
        unavailableCategories.push({
          categoryId: kitItem.assetCategoryId,
          required: kitItem.quantity,
          available,
        });
      }
    }

    return {
      isAvailable: unavailableCategories.length === 0,
      requiredQuantity: totalRequired,
      availableQuantity: totalAvailable,
      unavailableCategories,
    };
  }
}
