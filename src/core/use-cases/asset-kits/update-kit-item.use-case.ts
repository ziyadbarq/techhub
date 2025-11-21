/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import type { AssetKitItem } from "@/core/domain/entities/asset-kit-item.entity";

export interface UpdateKitItemRequest {
  itemId: string;
  quantity?: number;
  isRequired?: boolean;
  notes?: string;
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
      item.setRequired(request.isRequired);
    }

    if (request.notes !== undefined) {
      item.updateNotes(request.notes);
    }

    return this.kitItemRepository.update(item);
  }
}
