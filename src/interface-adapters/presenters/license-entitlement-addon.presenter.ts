/**
 * LicenseEntitlementAddon Presenter
 */

import type { LicenseEntitlementAddon } from "@/core/domain/entities/license-entitlement-addon.entity";
import type {
  LicenseEntitlementAddonDTO,
  CostAggregationDTO,
  EntitlementCostBreakdownDTO,
} from "../dtos/generated/license-entitlement-addon.dto";
import type { EntitlementCostBreakdown } from "@/core/use-cases/license-entitlement-addon/calculate-entitlement-total-cost.use-case";

export type {
  LicenseEntitlementAddonDTO,
  CostAggregationDTO,
  EntitlementCostBreakdownDTO,
};

export class LicenseEntitlementAddonPresenter {
  static toDTO(
    entitlementAddon: LicenseEntitlementAddon,
  ): LicenseEntitlementAddonDTO {
    return {
      id: entitlementAddon.id,
      licenseEntitlementId: entitlementAddon.licenseEntitlementId,
      licenseAddonId: entitlementAddon.licenseAddonId,
      cost: entitlementAddon.cost,
      currency: entitlementAddon.currency,
      note: entitlementAddon.note,
      createdAt: entitlementAddon.createdAt,
      updatedAt: entitlementAddon.updatedAt,
    };
  }

  static toDTOList(
    entitlementAddons: LicenseEntitlementAddon[],
  ): LicenseEntitlementAddonDTO[] {
    return entitlementAddons.map((addon) => this.toDTO(addon));
  }

  static toCostBreakdownDTO(
    breakdown: EntitlementCostBreakdown,
  ): EntitlementCostBreakdownDTO {
    return {
      entitlementId: breakdown.entitlementId,
      baseCost: breakdown.baseCost,
      addonCosts: breakdown.addonCosts,
      totalByCurrency: breakdown.totalByCurrency,
    };
  }
}
