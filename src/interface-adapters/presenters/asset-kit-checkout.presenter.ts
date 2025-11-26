/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

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
      kitId: checkout.kitId,
      assignedToPersonId: checkout.assignedToPersonId,
      assignedToOrgUnitId: checkout.assignedToOrgUnitId,
      checkoutDate: checkout.checkoutDate,
      expectedReturnDate: checkout.expectedReturnDate,
      actualReturnDate: checkout.actualReturnDate,
      purpose: checkout.purpose,
      status: checkout.status,
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
      checkoutId: item.checkoutId,
      assetId: item.assetId,
      checkoutDate: item.checkoutDate,
      returnDate: item.returnDate,
      conditionAtReturn: item.conditionAtReturn,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  static toDTOList(items: AssetKitCheckoutItem[]): AssetKitCheckoutItemDTO[] {
    return items.map((item) => this.toDTO(item));
  }
}
