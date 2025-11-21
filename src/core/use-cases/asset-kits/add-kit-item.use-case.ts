/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import type { AssetKitItem } from "@/core/domain/entities/asset-kit-item.entity";

export interface AddKitItemRequest {
  kitId: string;
  assetCategoryId: string;
  quantity: number;
  isRequired?: boolean;
  notes?: string;
}

@injectable()
export class AddKitItemUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitItemRepository)
    private readonly kitItemRepository: IAssetKitItemRepository,
  ) {}

  async execute(request: AddKitItemRequest): Promise<AssetKitItem> {
    const kitItem = AssetKitItem.create({
      kitId: request.kitId,
      assetCategoryId: request.assetCategoryId,
      quantity: request.quantity,
      isRequired: request.isRequired ?? true,
      notes: request.notes,
    });

    return this.kitItemRepository.create(kitItem);
  }
}
