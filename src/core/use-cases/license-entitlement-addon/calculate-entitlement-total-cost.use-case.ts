/**
 * Calculate Entitlement Total Cost Use Case
 *
 * Calculates the total cost of a license entitlement including:
 * - Base cost (unitCost × purchasedQuantity)
 * - All attached addon costs
 *
 * Returns costs grouped by currency since different currencies cannot be summed.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type {
  ILicenseEntitlementAddonRepository,
  CostAggregation,
} from "@/core/repositories/license-entitlement-addon.repository.interface";

export interface EntitlementCostBreakdown {
  entitlementId: string;
  baseCost: CostAggregation | null;
  addonCosts: CostAggregation[];
  totalByCurrency: CostAggregation[];
}

@injectable()
export class CalculateEntitlementTotalCostUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseEntitlementRepository)
    private entitlementRepository: ILicenseEntitlementRepository,
    @inject(DI_TOKENS.ILicenseEntitlementAddonRepository)
    private entitlementAddonRepository: ILicenseEntitlementAddonRepository,
  ) {}

  async execute(entitlementId: string): Promise<EntitlementCostBreakdown> {
    // Get entitlement for base cost calculation
    const entitlement =
      await this.entitlementRepository.findById(entitlementId);
    if (!entitlement) {
      throw new Error("License entitlement not found");
    }

    // Calculate base cost
    let baseCost: CostAggregation | null = null;
    const totalCost = entitlement.calculateTotalCost();
    if (totalCost !== null && entitlement.currency) {
      baseCost = {
        currency: entitlement.currency,
        total: totalCost,
      };
    }

    // Get addon costs grouped by currency
    const addonCosts =
      await this.entitlementAddonRepository.sumCostByEntitlementId(
        entitlementId,
      );

    // Calculate total by currency (combine base + addons)
    const costMap = new Map<string, number>();

    if (baseCost) {
      costMap.set(baseCost.currency, baseCost.total);
    }

    for (const addonCost of addonCosts) {
      const current = costMap.get(addonCost.currency) || 0;
      costMap.set(addonCost.currency, current + addonCost.total);
    }

    const totalByCurrency: CostAggregation[] = Array.from(
      costMap.entries(),
    ).map(([currency, total]) => ({
      currency,
      total,
    }));

    return {
      entitlementId,
      baseCost,
      addonCosts,
      totalByCurrency,
    };
  }
}
