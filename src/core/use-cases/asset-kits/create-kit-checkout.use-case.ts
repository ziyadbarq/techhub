import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";
import { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";
import type { AssigneeType } from "@/core/domain/entities/asset-kit-checkout.entity";
import { AssetKitCheckoutItem } from "@/core/domain/entities/asset-kit-checkout-item.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateKitCheckoutRequest {
  kitId: string;
  assigneeType: AssigneeType;
  assigneeId: string;
  checkedOutById?: string;
  expectedReturnDate?: Date;
  note?: string;
  assetIds?: string[];
  kitItemIds?: string[];
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

    const assetIds = request.assetIds ?? [];
    const kitItemIds = request.kitItemIds ?? [];

    // Only validate asset counts when assets are explicitly provided
    if (assetIds.length > 0) {
      const requiredQuantity = kitItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      if (assetIds.length < requiredQuantity) {
        throw new Error(
          `Kit requires ${requiredQuantity} assets, but only ${assetIds.length} provided`,
        );
      }
    }

    // Create checkout
    const checkout = AssetKitCheckout.create(
      {
        assetKitId: request.kitId,
        assigneeType: request.assigneeType,
        assigneeId: request.assigneeId,
        checkedOutById: request.checkedOutById ?? request.assigneeId,
        expectedReturnDate: request.expectedReturnDate,
        note: request.note,
      },
      this.idGenerator,
    );

    const createdCheckout = await this.kitCheckoutRepository.create(checkout);

    // Create checkout items for each asset (when assets are explicitly provided)
    for (let i = 0; i < assetIds.length; i++) {
      const checkoutItem = AssetKitCheckoutItem.create(
        {
          kitCheckoutId: createdCheckout.id,
          assetId: assetIds[i],
          kitItemId: kitItemIds[i] ?? kitItems[i]?.id ?? assetIds[i],
        },
        this.idGenerator,
      );
      await this.checkoutItemRepository.create(checkoutItem);
    }

    return createdCheckout;
  }
}
