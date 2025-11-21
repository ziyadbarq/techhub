/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";
import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";

export interface ReturnKitCheckoutRequest {
  checkoutId: string;
  returnDate?: Date;
}

@injectable()
export class ReturnKitCheckoutUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
    @inject(DI_TOKENS.IAssetKitCheckoutItemRepository)
    private readonly checkoutItemRepository: IAssetKitCheckoutItemRepository,
  ) {}

  async execute(request: ReturnKitCheckoutRequest): Promise<AssetKitCheckout> {
    const checkout = await this.kitCheckoutRepository.findById(
      request.checkoutId,
    );
    if (!checkout) {
      throw new Error(`Kit checkout with ID ${request.checkoutId} not found`);
    }

    // Return all items that haven't been returned yet
    const items = await this.checkoutItemRepository.findByCheckoutId(
      request.checkoutId,
    );
    const returnDate = request.returnDate || new Date();

    for (const item of items) {
      if (item.status === "CHECKED_OUT") {
        item.returnItem();
        await this.checkoutItemRepository.update(item);
      }
    }

    // Complete the checkout
    checkout.completeReturn(returnDate);

    return this.kitCheckoutRepository.update(checkout);
  }
}
