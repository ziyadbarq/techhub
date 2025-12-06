/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";
import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";
import { AssetKitCheckoutItem } from "@/core/domain/entities/asset-kit-checkout-item.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateKitCheckoutRequest {
  kitId: string;
  assignedToPersonId?: string;
  assignedToOrgUnitId?: string;
  checkoutDate: Date;
  expectedReturnDate: Date;
  purpose?: string;
  assetIds: string[];
}

@injectable()
export class CreateKitCheckoutUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
    @inject(DI_TOKENS.IAssetKitItemRepository)
    private readonly kitItemRepository: IAssetKitItemRepository,
    @inject(DI_TOKENS.IAssetKitCheckoutItemRepository)
    private readonly checkoutItemRepository: IAssetKitCheckoutItemRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(request: CreateKitCheckoutRequest): Promise<AssetKitCheckout> {
    // Validate kit exists and has items
    const kitItems = await this.kitItemRepository.findByKitId(request.kitId);
    if (kitItems.length === 0) {
      throw new Error("Cannot checkout empty kit");
    }

    // Validate asset count matches kit requirements
    const requiredQuantity = kitItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    if (request.assetIds.length < requiredQuantity) {
      throw new Error(
        `Kit requires ${requiredQuantity} assets, but only ${request.assetIds.length} provided`,
      );
    }

    // Create checkout
    const checkout = AssetKitCheckout.create(
      {
        kitId: request.kitId,
        assignedToPersonId: request.assignedToPersonId,
        assignedToOrgUnitId: request.assignedToOrgUnitId,
        checkoutDate: request.checkoutDate,
        expectedReturnDate: request.expectedReturnDate,
        purpose: request.purpose,
      },
      this.idGenerator,
    );

    const createdCheckout = await this.kitCheckoutRepository.create(
      checkout,
      this.idGenerator,
    );

    // Create checkout items for each asset
    for (const assetId of request.assetIds) {
      const checkoutItem = AssetKitCheckoutItem.create(
        {
          checkoutId: createdCheckout.id,
          assetId,
          checkoutDate: request.checkoutDate,
        },
        this.idGenerator,
      );
      await this.checkoutItemRepository.create(checkoutItem, this.idGenerator);
    }

    return createdCheckout;
  }
}
