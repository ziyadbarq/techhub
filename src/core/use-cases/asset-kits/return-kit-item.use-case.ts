import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { AssetKitCheckoutItem } from "@/core/domain/entities/asset-kit-checkout-item.entity";

export interface ReturnKitItemRequest {
  checkoutItemId: string;
  conditionAtReturn?: string;
}

@injectable()
export class ReturnKitItemUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitCheckoutItemRepository)
    private readonly checkoutItemRepository: IAssetKitCheckoutItemRepository,
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
  ) {}

  async execute(request: ReturnKitItemRequest): Promise<AssetKitCheckoutItem> {
    const item = await this.checkoutItemRepository.findById(
      request.checkoutItemId,
    );
    if (!item) {
      throw new ValidationError(
        `Checkout item with ID ${request.checkoutItemId} not found`,
      );
    }

    item.returnItem(request.conditionAtReturn);
    const updatedItem = await this.checkoutItemRepository.update(item);

    // Check if all items are returned and update checkout status
    const allItems = await this.checkoutItemRepository.findByCheckoutId(
      item.kitCheckoutId,
    );
    const unreturned = allItems.filter((i) => i.status === "CHECKED_OUT");

    if (unreturned.length === 0) {
      const checkout = await this.kitCheckoutRepository.findById(
        item.kitCheckoutId,
      );
      if (checkout) {
        checkout.returnAllItems();
        await this.kitCheckoutRepository.update(checkout);
      }
    } else {
      // Some items returned but not all - mark as partially returned
      const checkout = await this.kitCheckoutRepository.findById(
        item.kitCheckoutId,
      );
      if (checkout && checkout.isCheckedOut()) {
        checkout.markPartiallyReturned();
        await this.kitCheckoutRepository.update(checkout);
      }
    }

    return updatedItem;
  }
}
