import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import type { AssetKitItem } from "@/core/domain/entities/asset-kit-item.entity";

export interface UpdateKitItemRequest {
  itemId: string;
  quantity?: number;
  isRequired?: boolean;
  note?: string;
}

@injectable()
export class UpdateKitItemUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitItemRepository)
    private readonly kitItemRepository: IAssetKitItemRepository,
  ) {}

  async execute(request: UpdateKitItemRequest): Promise<AssetKitItem> {
    const item = await this.kitItemRepository.findById(request.itemId);
    if (!item) {
      throw new Error(`Kit item with ID ${request.itemId} not found`);
    }

    if (request.quantity !== undefined) {
      item.updateQuantity(request.quantity);
    }

    if (request.isRequired !== undefined) {
      if (request.isRequired) {
        item.markAsRequired();
      } else {
        item.markAsOptional();
      }
    }

    if (request.note !== undefined) {
      item.updateNote(request.note);
    }

    return this.kitItemRepository.update(item);
  }
}
