/**
 * LicenseEntitlement Presenter
 */

import type { LicenseEntitlement } from "@/core/domain/entities/license-entitlement.entity";
import type { LicenseEntitlementDTO } from "../dtos/generated/license-entitlement.dto";

export type { LicenseEntitlementDTO };

export class LicenseEntitlementPresenter {
  static toDTO(entitlement: LicenseEntitlement): LicenseEntitlementDTO {
    return {
      id: entitlement.id,
      licenseProductId: entitlement.licenseProductId,
      contractId: entitlement.contractId,
      purchasedQuantity: entitlement.purchasedQuantity,
      effectiveStart: entitlement.effectiveStart,
      effectiveEnd: entitlement.effectiveEnd,
      allowedScope: entitlement.allowedScope,
      note: entitlement.note,
      createdAt: entitlement.createdAt,
      updatedAt: entitlement.updatedAt,
      isActive: entitlement.isActive(),
      isExpired: entitlement.isExpired(),
    };
  }

  static toDTOList(
    entitlements: LicenseEntitlement[],
  ): LicenseEntitlementDTO[] {
    return entitlements.map((entitlement) => this.toDTO(entitlement));
  }
}
