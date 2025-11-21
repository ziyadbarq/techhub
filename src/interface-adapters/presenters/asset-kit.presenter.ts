/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import type { AssetKit } from "@/core/domain/entities/asset-kit.entity";
import type { AssetKitItem } from "@/core/domain/entities/asset-kit-item.entity";
import type {
  AssetKitDTO,
  AssetKitItemDTO,
} from "../dtos/generated/asset-kit.dto";

export class AssetKitPresenter {
  static toDTO(kit: AssetKit): AssetKitDTO {
    return {
      id: kit.id,
      name: kit.name,
      code: kit.code,
      description: kit.description,
      isActive: kit.isActive,
      createdAt: kit.createdAt,
      updatedAt: kit.updatedAt,
    };
  }

  static toDTOList(kits: AssetKit[]): AssetKitDTO[] {
    return kits.map((kit) => this.toDTO(kit));
  }
}

export class AssetKitItemPresenter {
  static toDTO(item: AssetKitItem): AssetKitItemDTO {
    return {
      id: item.id,
      kitId: item.kitId,
      assetCategoryId: item.assetCategoryId,
      quantity: item.quantity,
      isRequired: item.isRequired,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  static toDTOList(items: AssetKitItem[]): AssetKitItemDTO[] {
    return items.map((item) => this.toDTO(item));
  }
}
