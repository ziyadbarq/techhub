import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetKitCheckoutRequest {
  checkoutId: string;
}

@injectable()
export class GetKitCheckoutUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
  ) {}

  async execute(request: GetKitCheckoutRequest): Promise<AssetKitCheckout> {
    const checkout = await this.kitCheckoutRepository.findById(
      request.checkoutId,
    );
    if (!checkout) {
      throw new NotFoundError(
        `Kit checkout with ID ${request.checkoutId} not found`,
      );
    }
    return checkout;
  }
}
