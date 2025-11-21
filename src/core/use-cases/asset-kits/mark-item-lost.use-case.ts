/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { AssetKitCheckoutItem } from "@/core/domain/entities/asset-kit-checkout-item.entity";

export interface MarkItemLostRequest {
  checkoutItemId: string;
  notes?: string;
}

@injectable()
export class MarkItemLostUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitCheckoutItemRepository)
    private readonly checkoutItemRepository: IAssetKitCheckoutItemRepository,
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
  ) {}

  async execute(request: MarkItemLostRequest): Promise<AssetKitCheckoutItem> {
    const item = await this.checkoutItemRepository.findById(
      request.checkoutItemId,
    );
    if (!item) {
      throw new Error(
        `Checkout item with ID ${request.checkoutItemId} not found`,
      );
    }

    item.markAsLost(request.notes);
    const updatedItem = await this.checkoutItemRepository.update(item);

    // Update checkout to partial return if not already
    const checkout = await this.kitCheckoutRepository.findById(item.checkoutId);
    if (checkout && checkout.status === "CHECKED_OUT") {
      checkout.partialReturn(new Date());
      await this.kitCheckoutRepository.update(checkout);
    }

    return updatedItem;
  }
}
