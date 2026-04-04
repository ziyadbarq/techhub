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
      kitType: kit.kitType,
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
      assetKitId: item.assetKitId,
      assetCategoryId: item.assetCategoryId,
      assetModelId: item.assetModelId,
      quantity: item.quantity,
      isRequired: item.isRequired,
      note: item.note,
      createdAt: item.createdAt,
    };
  }

  static toDTOList(items: AssetKitItem[]): AssetKitItemDTO[] {
    return items.map((item) => this.toDTO(item));
  }
}
