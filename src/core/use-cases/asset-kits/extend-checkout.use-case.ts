import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface ExtendCheckoutRequest {
  checkoutId: string;
  newExpectedReturnDate: Date;
}

@injectable()
export class ExtendCheckoutUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
  ) {}

  async execute(request: ExtendCheckoutRequest): Promise<AssetKitCheckout> {
    const checkout = await this.kitCheckoutRepository.findById(
      request.checkoutId,
    );
    if (!checkout) {
      throw new NotFoundError(
        `Kit checkout with ID ${request.checkoutId} not found`,
      );
    }

    if (checkout.status !== "CHECKED_OUT") {
      throw new ValidationError("Can only extend active checkouts");
    }

    checkout.extendReturnDate(request.newExpectedReturnDate);

    return this.kitCheckoutRepository.update(checkout);
  }
}
