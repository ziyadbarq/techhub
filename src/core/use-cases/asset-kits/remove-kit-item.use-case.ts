import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";

export interface RemoveKitItemRequest {
  itemId: string;
}

@injectable()
export class RemoveKitItemUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitItemRepository)
    private readonly kitItemRepository: IAssetKitItemRepository,
  ) {}

  async execute(request: RemoveKitItemRequest): Promise<void> {
    const item = await this.kitItemRepository.findById(request.itemId);
    if (!item) {
      throw new Error(`Kit item with ID ${request.itemId} not found`);
    }

    await this.kitItemRepository.delete(request.itemId);
  }
}
