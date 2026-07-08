import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";
import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";
import type { IUnitOfWork } from "@/core/services/unit-of-work.service.interface";

export interface ReturnKitCheckoutRequest {
  checkoutId: string;
  conditionAtReturn?: string;
}

@injectable()
export class ReturnKitCheckoutUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
    @inject(DI_TOKENS.IAssetKitCheckoutItemRepository)
    private readonly checkoutItemRepository: IAssetKitCheckoutItemRepository,
    @inject(DI_TOKENS.IUnitOfWork)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(request: ReturnKitCheckoutRequest): Promise<AssetKitCheckout> {
    // Item returns and checkout completion commit atomically: a failure
    // mid-way rolls everything back instead of leaving some items returned
    // while the checkout stays open.
    return this.unitOfWork.execute(async () => {
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

      for (const item of items) {
        if (item.status === "CHECKED_OUT") {
          item.returnItem(request.conditionAtReturn);
          await this.checkoutItemRepository.update(item);
        }
      }

      // Complete the checkout
      checkout.returnAllItems();

      return this.kitCheckoutRepository.update(checkout);
    });
  }
}
