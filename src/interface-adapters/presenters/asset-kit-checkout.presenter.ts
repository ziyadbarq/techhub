import type { AssetKitCheckout } from "@/core/domain/entities/asset-kit-checkout.entity";
import type { AssetKitCheckoutItem } from "@/core/domain/entities/asset-kit-checkout-item.entity";
import type {
  AssetKitCheckoutDTO,
  AssetKitCheckoutItemDTO,
} from "../dtos/generated/asset-kit-checkout.dto";

export interface AssetKitCheckoutEnrichment {
  kitName?: string;
  personName?: string;
}

export class AssetKitCheckoutPresenter {
  static toDTO(
    checkout: AssetKitCheckout,
    enrichment?: AssetKitCheckoutEnrichment,
  ): AssetKitCheckoutDTO {
    return {
      id: checkout.id,
      assetKitId: checkout.assetKitId,
      assigneeType: checkout.assigneeType,
      assigneeId: checkout.assigneeId,
      checkoutDate: checkout.checkoutDate,
      expectedReturnDate: checkout.expectedReturnDate,
      actualReturnDate: checkout.actualReturnDate,
      status: checkout.status,
      checkedOutById: checkout.checkedOutById,
      note: checkout.note,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
      // Display fields
      kitName: enrichment?.kitName,
      personName: enrichment?.personName,
    };
  }

  static toDTOList(
    checkouts: AssetKitCheckout[],
    enrichmentMap?: Map<string, AssetKitCheckoutEnrichment>,
  ): AssetKitCheckoutDTO[] {
    return checkouts.map((checkout) =>
      this.toDTO(checkout, enrichmentMap?.get(checkout.id)),
    );
  }
}

export class AssetKitCheckoutItemPresenter {
  static toDTO(item: AssetKitCheckoutItem): AssetKitCheckoutItemDTO {
    return {
      id: item.id,
      kitCheckoutId: item.kitCheckoutId,
      assetId: item.assetId,
      kitItemId: item.kitItemId,
      checkoutDate: item.checkoutDate,
      returnDate: item.returnDate,
      status: item.status,
      conditionAtCheckout: item.conditionAtCheckout,
      conditionAtReturn: item.conditionAtReturn,
      note: item.note,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  static toDTOList(items: AssetKitCheckoutItem[]): AssetKitCheckoutItemDTO[] {
    return items.map((item) => this.toDTO(item));
  }
}
