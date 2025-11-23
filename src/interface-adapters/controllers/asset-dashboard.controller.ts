/**
 * Asset Dashboard Controller
 * Server actions for dashboard statistics and reporting
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { ListAssetAssignmentsUseCase } from "@/core/use-cases/asset/asset-assignment";
import type { ListAssetCategoriesUseCase } from "@/core/use-cases/asset/asset-category";
import type { ListLifecycleStatesUseCase } from "@/core/use-cases/foundation/lifecycle-state";
import type { ListStockMovementsUseCase } from "@/core/use-cases/inventory/stock-movement";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ListStockLocationsUseCase } from "@/core/use-cases/inventory/stock-location";
import type { ConvertCurrencyUseCase } from "@/core/use-cases/foundation/exchange-rate";

export interface AssetSummaryStats {
  totalAssets: number;
  totalValue: number;
  currency: string;
  assetsUnderWarranty: number;
  unassignedAssets: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  count: number;
  value: number;
}

export interface LifecycleStateBreakdown {
  stateId: string;
  stateName: string;
  count: number;
}

export interface WarrantyStatusBreakdown {
  active: number;
  expiringSoon: number; // Expiring in next 30 days
  expired: number;
  none: number;
}

export interface LocationBreakdown {
  locationId: string;
  locationName: string;
  count: number;
}

export interface RecentActivity {
  type: "assignment" | "movement";
  id: string;
  assetId: string;
  assetTag: string;
  description: string;
  timestamp: string;
}

/**
 * Get asset summary statistics
 * All financial values are aggregated in SAR (Saudi Riyal)
 */
export async function getAssetSummaryStatsAction(): Promise<
  ActionResponse<AssetSummaryStats>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const listAssetsUseCase = container.get<ListAssetsUseCase>(
      DI_TOKENS.ListAssetsUseCase,
    );
    const listAssignmentsUseCase = container.get<ListAssetAssignmentsUseCase>(
      DI_TOKENS.ListAssetAssignmentsUseCase,
    );
    const convertCurrencyUseCase = container.get<ConvertCurrencyUseCase>(
      DI_TOKENS.ConvertCurrencyUseCase,
    );

    const [assets, assignments] = await Promise.all([
      listAssetsUseCase.execute(),
      listAssignmentsUseCase.execute(),
    ]);

    // Calculate total value in SAR (convert all currencies to SAR before summing)
    let totalValueInSAR = 0;
    for (const asset of assets) {
      if (asset.purchaseCost && asset.currency) {
        try {
          // Convert to SAR using exchange rates
          const conversionResult = await convertCurrencyUseCase.execute({
            amount: asset.purchaseCost,
            fromCurrency: asset.currency,
          });
          totalValueInSAR += conversionResult.convertedAmount;
        } catch (error) {
          // If exchange rate not found, skip this asset's value
          // Assets with missing exchange rates are excluded from total calculation
        }
      }
    }

    // Count assets under warranty
    const now = new Date();
    const assetsUnderWarranty = assets.filter((asset) =>
      asset.isUnderWarranty(),
    ).length;

    // Count unassigned assets (assets with no active assignment)
    const assignedAssetIds = new Set(
      assignments
        .filter(
          (a) => !a.endDate || new Date(a.endDate) > now || a.endDate === null,
        )
        .map((a) => a.assetId),
    );
    const unassignedAssets = assets.filter(
      (a) => !assignedAssetIds.has(a.id),
    ).length;

    return {
      success: true,
      data: {
        totalAssets: assets.length,
        totalValue: totalValueInSAR,
        currency: "SAR", // Always SAR for aggregated values
        assetsUnderWarranty,
        unassignedAssets,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetSummaryStatsAction" },
      "Failed to get asset summary statistics",
    );
  }
}

/**
 * Get assets breakdown by category
 * All financial values are aggregated in SAR (Saudi Riyal)
 */
export async function getAssetsByCategoryAction(): Promise<
  ActionResponse<CategoryBreakdown[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const listAssetsUseCase = container.get<ListAssetsUseCase>(
      DI_TOKENS.ListAssetsUseCase,
    );
    const listCategoriesUseCase = container.get<ListAssetCategoriesUseCase>(
      DI_TOKENS.ListAssetCategoriesUseCase,
    );
    const convertCurrencyUseCase = container.get<ConvertCurrencyUseCase>(
      DI_TOKENS.ConvertCurrencyUseCase,
    );

    const [assets, categories] = await Promise.all([
      listAssetsUseCase.execute(),
      listCategoriesUseCase.execute(),
    ]);

    // Build category map for names
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Group by category (convert all values to SAR)
    const breakdown = new Map<string, { count: number; value: number }>();

    for (const asset of assets) {
      const categoryId = asset.assetCategoryId;
      const existing = breakdown.get(categoryId) || { count: 0, value: 0 };

      // Convert asset cost to SAR before adding
      let costInSAR = 0;
      if (asset.purchaseCost && asset.currency) {
        try {
          const conversionResult = await convertCurrencyUseCase.execute({
            amount: asset.purchaseCost,
            fromCurrency: asset.currency,
          });
          costInSAR = conversionResult.convertedAmount;
        } catch (error) {
          // If exchange rate not found, skip this asset's value
          // Assets with missing exchange rates are excluded from category value calculation
        }
      }

      breakdown.set(categoryId, {
        count: existing.count + 1,
        value: existing.value + costInSAR,
      });
    }

    // Convert to array
    const result: CategoryBreakdown[] = Array.from(breakdown.entries()).map(
      ([categoryId, data]) => ({
        categoryId,
        categoryName: categoryMap.get(categoryId) || "Unknown",
        count: data.count,
        value: data.value,
      }),
    );

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetsByCategoryAction" },
      "Failed to get assets by category",
    );
  }
}

/**
 * Get assets breakdown by lifecycle state
 */
export async function getAssetsByLifecycleStateAction(): Promise<
  ActionResponse<LifecycleStateBreakdown[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const listAssetsUseCase = container.get<ListAssetsUseCase>(
      DI_TOKENS.ListAssetsUseCase,
    );
    const listStatesUseCase = container.get<ListLifecycleStatesUseCase>(
      DI_TOKENS.ListLifecycleStatesUseCase,
    );

    const [assets, states] = await Promise.all([
      listAssetsUseCase.execute(),
      listStatesUseCase.execute(),
    ]);

    // Build state map for names
    const stateMap = new Map(states.map((s) => [s.id, s.name]));

    // Group by lifecycle state
    const breakdown = new Map<string, number>();

    for (const asset of assets) {
      if (asset.lifecycleStateId) {
        const stateId = asset.lifecycleStateId;
        breakdown.set(stateId, (breakdown.get(stateId) || 0) + 1);
      }
    }

    // Convert to array
    const result: LifecycleStateBreakdown[] = Array.from(
      breakdown.entries(),
    ).map(([stateId, count]) => ({
      stateId,
      stateName: stateMap.get(stateId) || "Unknown",
      count,
    }));

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetsByLifecycleStateAction" },
      "Failed to get assets by lifecycle state",
    );
  }
}

/**
 * Get warranty status breakdown
 */
export async function getWarrantyStatusBreakdownAction(): Promise<
  ActionResponse<WarrantyStatusBreakdown>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const listAssetsUseCase = container.get<ListAssetsUseCase>(
      DI_TOKENS.ListAssetsUseCase,
    );

    const assets = await listAssetsUseCase.execute();

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let none = 0;

    for (const asset of assets) {
      if (!asset.warrantyEndDate) {
        none++;
      } else {
        const warrantyEnd = new Date(asset.warrantyEndDate);
        if (warrantyEnd < now) {
          expired++;
        } else if (warrantyEnd <= thirtyDaysFromNow) {
          expiringSoon++;
        } else {
          active++;
        }
      }
    }

    return {
      success: true,
      data: {
        active,
        expiringSoon,
        expired,
        none,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getWarrantyStatusBreakdownAction" },
      "Failed to get warranty status breakdown",
    );
  }
}

/**
 * Get assets by location (top 5)
 */
export async function getAssetsByLocationAction(): Promise<
  ActionResponse<LocationBreakdown[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const listAssetsUseCase = container.get<ListAssetsUseCase>(
      DI_TOKENS.ListAssetsUseCase,
    );
    const listLocationsUseCase = container.get<ListStockLocationsUseCase>(
      DI_TOKENS.ListStockLocationsUseCase,
    );

    const [assets, locations] = await Promise.all([
      listAssetsUseCase.execute(),
      listLocationsUseCase.execute(),
    ]);

    // Build location map for names
    const locationMap = new Map(locations.map((l) => [l.id, l.name]));

    // Group by stock location
    const breakdown = new Map<string, number>();

    for (const asset of assets) {
      if (asset.currentStockLocationId) {
        const locationId = asset.currentStockLocationId;
        breakdown.set(locationId, (breakdown.get(locationId) || 0) + 1);
      }
    }

    // Convert to array and sort by count descending
    const result: LocationBreakdown[] = Array.from(breakdown.entries())
      .map(([locationId, count]) => ({
        locationId,
        locationName: locationMap.get(locationId) || "Unknown",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 locations

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAssetsByLocationAction" },
      "Failed to get assets by location",
    );
  }
}

/**
 * Get recent activity (assignments and movements)
 */
export async function getRecentActivityAction(): Promise<
  ActionResponse<RecentActivity[]>
> {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);

    const container = getContainer();
    const listAssetsUseCase = container.get<ListAssetsUseCase>(
      DI_TOKENS.ListAssetsUseCase,
    );
    const listAssignmentsUseCase = container.get<ListAssetAssignmentsUseCase>(
      DI_TOKENS.ListAssetAssignmentsUseCase,
    );
    const listMovementsUseCase = container.get<ListStockMovementsUseCase>(
      DI_TOKENS.ListStockMovementsUseCase,
    );

    const [assets, assignments, movements] = await Promise.all([
      listAssetsUseCase.execute(),
      listAssignmentsUseCase.execute(),
      listMovementsUseCase.execute(),
    ]);

    // Build asset tag map
    const assetMap = new Map(assets.map((a) => [a.id, a.assetTag]));

    // Combine and transform activities
    const activities: RecentActivity[] = [];

    // Add assignments (last 10)
    const recentAssignments = assignments
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    for (const assignment of recentAssignments) {
      activities.push({
        type: "assignment",
        id: assignment.id,
        assetId: assignment.assetId,
        assetTag: assetMap.get(assignment.assetId) || "Unknown",
        description: `Assigned to ${assignment.assigneeType} (${assignment.assigneeId})`,
        timestamp: new Date(assignment.createdAt).toISOString(),
      });
    }

    // Add movements (last 10)
    const recentMovements = movements
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )
      .slice(0, 10);

    for (const movement of recentMovements) {
      if (movement.assetId) {
        activities.push({
          type: "movement",
          id: movement.id,
          assetId: movement.assetId,
          assetTag: assetMap.get(movement.assetId) || "Unknown",
          description: `${movement.movementType}: ${movement.reason || "Stock movement"}`,
          timestamp: new Date(movement.occurredAt).toISOString(),
        });
      }
    }

    // Sort by timestamp descending and limit to 20 total
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const result = activities.slice(0, 20);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRecentActivityAction" },
      "Failed to get recent activity",
    );
  }
}
