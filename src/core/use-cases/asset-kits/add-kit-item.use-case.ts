import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import { AssetKitItem } from "@/core/domain/entities/asset-kit-item.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface AddKitItemRequest {
  kitId: string;
  assetCategoryId: string;
  quantity: number;
  isRequired?: boolean;
  note?: string;
}

@injectable()
export class AddKitItemUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitItemRepository)
    private readonly kitItemRepository: IAssetKitItemRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(request: AddKitItemRequest): Promise<AssetKitItem> {
    const kitItem = AssetKitItem.create(
      {
        assetKitId: request.kitId,
        assetCategoryId: request.assetCategoryId,
        quantity: request.quantity,
        isRequired: request.isRequired ?? true,
        note: request.note,
      },
      this.idGenerator,
    );

    return this.kitItemRepository.create(kitItem);
  }
}
