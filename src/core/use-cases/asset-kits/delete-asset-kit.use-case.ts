import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteAssetKitRequest {
  kitId: string;
}

@injectable()
export class DeleteAssetKitUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitRepository)
    private readonly assetKitRepository: IAssetKitRepository,
    @inject(DI_TOKENS.IAssetKitCheckoutRepository)
    private readonly kitCheckoutRepository: IAssetKitCheckoutRepository,
  ) {}

  async execute(request: DeleteAssetKitRequest): Promise<void> {
    const kit = await this.assetKitRepository.findById(request.kitId);
    if (!kit) {
      throw new NotFoundError(`Asset kit with ID ${request.kitId} not found`);
    }

    // Check if kit has active checkouts
    const activeCheckouts = await this.kitCheckoutRepository.findByKitId(
      request.kitId,
    );
    const hasActiveCheckout = activeCheckouts.some(
      (checkout) =>
        checkout.status === "CHECKED_OUT" ||
        checkout.status === "PARTIALLY_RETURNED",
    );
    if (hasActiveCheckout) {
      throw new Error(
        "Cannot delete kit with active checkouts. Please return all items first.",
      );
    }

    await this.assetKitRepository.delete(request.kitId);
  }
}
