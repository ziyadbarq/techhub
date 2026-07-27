/**
 * Assets Page Client Component
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, Package, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import {
  listAssetsAction,
  getAssetStatisticsAction,
  getAssetFilterOptionsAction,
  type AssetFilterOptions,
} from "@/interface-adapters/controllers/asset.controller";
import type { AssetStatistics } from "@/core/repositories/asset.repository.interface";

import { AssetsTable } from "./assets-table";
import { AssetForm } from "./asset-form";
import { AssetsSummaryCards } from "./assets-summary-cards";
import { AssetsToolbar } from "./assets-toolbar";
import { BulkActionBar } from "./bulk-action-bar";
import { ImportAssetsWizard } from "./import-assets-wizard";

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { exportAssetsToCSV } from "@/lib/csv-export";
import { exportAssetsToXLSX } from "@/lib/xlsx-export";
import { useTableFilters } from "@/hooks/use-table-filters";

interface AssetsPageClientProps {
  /** Initial data from server */
  initialAssets: AssetDTO[];
  /** Initial statistics from server */
  initialStatistics?: AssetStatistics;
  /** Initial filter options from server */
  initialFilterOptions?: AssetFilterOptions;
}

export function AssetsPageClient({
  initialAssets,
  initialStatistics,
  initialFilterOptions,
}: AssetsPageClientProps) {
  // Assets data state
  const [assets, setAssets] = useState<AssetDTO[]>(initialAssets);

  // Statistics state
  const [statistics, setStatistics] = useState<AssetStatistics | null>(
    initialStatistics ?? null,
  );
  const [statisticsLoading, setStatisticsLoading] =
    useState(!initialStatistics);

  // Filter options state
  const [filterOptions, setFilterOptions] = useState<AssetFilterOptions | null>(
    initialFilterOptions ?? null,
  );

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetDTO | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<AssetDTO[]>([]);

  // Filters using generic hook
  const filters = useTableFilters<{
    assetCategoryId: string;
    lifecycleStateId: string;
    currentStockLocationId: string;
    vendorId: string;
    assignedUserTerm: string;
    hostNameTerm: string;
  }>({
    initialFilters: {
      assetCategoryId: "all",
      lifecycleStateId: "all",
      currentStockLocationId: "all",
      vendorId: "all",
      assignedUserTerm: "",
      hostNameTerm: "",
    },
    searchConfig: { debounceMs: 300 },
  });

  const loadFilterOptions = async () => {
    try {
      const result = await getAssetFilterOptionsAction();
      if (result.success && result.data) {
        setFilterOptions(result.data);
      }
    } catch {
      // Silently fail - filters will just be disabled
    }
  };

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listAssetsAction();
      if (result.success && result.data) {
        setAssets(result.data);
        // Clear selection when data changes
        setSelectedAssets([]);
      } else if (!result.success) {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    setStatisticsLoading(true);
    try {
      const result = await getAssetStatisticsAction();
      if (result.success && result.data) {
        setStatistics(result.data);
      }
    } catch {
      // Silently fail - stats will show loading state
    } finally {
      setStatisticsLoading(false);
    }
  }, []);

  // Pre-filter assets data based on filters (following TABLE_COMPONENTS_GUIDE pattern)
  const filteredAssets = useMemo(() => {
    let result = assets;

    // Apply search filter
    if (filters.debouncedSearchTerm) {
      const term = filters.debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.assetTag.toLowerCase().includes(term) ||
          (asset.serialNumber?.toLowerCase().includes(term) ?? false) ||
          (asset.categoryName?.toLowerCase().includes(term) ?? false) ||
          (asset.modelName?.toLowerCase().includes(term) ?? false) ||
          (asset.vendorName?.toLowerCase().includes(term) ?? false) ||
          (asset.assignedUserName?.toLowerCase().includes(term) ?? false) ||
          (asset.assignedUserEmail?.toLowerCase().includes(term) ?? false) ||
          (asset.hostName?.toLowerCase().includes(term) ?? false),
      );
    }

    // Apply category filter
    if (filters.filters.assetCategoryId !== "all") {
      result = result.filter(
        (asset) => asset.assetCategoryId === filters.filters.assetCategoryId,
      );
    }

    // Apply lifecycle state filter
    if (filters.filters.lifecycleStateId !== "all") {
      result = result.filter(
        (asset) => asset.lifecycleStateId === filters.filters.lifecycleStateId,
      );
    }

    // Apply stock location filter
    if (filters.filters.currentStockLocationId !== "all") {
      result = result.filter(
        (asset) =>
          asset.currentStockLocationId ===
          filters.filters.currentStockLocationId,
      );
    }

    // Apply vendor filter
    if (filters.filters.vendorId !== "all") {
      result = result.filter(
        (asset) => asset.vendorId === filters.filters.vendorId,
      );
    }

    if (filters.filters.assignedUserTerm) {
      const term = filters.filters.assignedUserTerm.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.assignedUserName?.toLowerCase().includes(term) ||
          asset.assignedUserEmail?.toLowerCase().includes(term),
      );
    }

    if (filters.filters.hostNameTerm) {
      const term = filters.filters.hostNameTerm.toLowerCase();
      result = result.filter((asset) =>
        asset.hostName?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [assets, filters.debouncedSearchTerm, filters.filters]);

  const categoryCards = useMemo(() => {
    const countsByCategoryId = new Map<string, number>();
    const namesByCategoryId = new Map<string, string>();

    for (const asset of assets) {
      countsByCategoryId.set(
        asset.assetCategoryId,
        (countsByCategoryId.get(asset.assetCategoryId) ?? 0) + 1,
      );

      if (asset.categoryName) {
        namesByCategoryId.set(asset.assetCategoryId, asset.categoryName);
      }
    }

    const optionCards =
      filterOptions?.categories.map((category) => ({
        id: category.value,
        name: category.label,
        count: countsByCategoryId.get(category.value) ?? 0,
      })) ?? [];

    for (const [categoryId, count] of countsByCategoryId.entries()) {
      if (optionCards.some((category) => category.id === categoryId)) {
        continue;
      }

      optionCards.push({
        id: categoryId,
        name: namesByCategoryId.get(categoryId) ?? "Uncategorized",
        count,
      });
    }

    return optionCards.sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    );
  }, [assets, filterOptions?.categories]);

  // Load filter options on mount if not provided
  useEffect(() => {
    if (!initialFilterOptions) {
      loadFilterOptions();
    }
  }, [initialFilterOptions]);

  // No need to load assets on mount - we have initialAssets
  // Assets are only reloaded when handleSuccess is called (after create/update/delete)

  const handleEdit = (asset: AssetDTO) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
  };

  const handleSuccess = () => {
    loadAssets();
    loadStatistics();
  };

  const handleExportCSV = () => {
    if (filteredAssets.length === 0) {
      toast.error("No assets to export");
      return;
    }
    exportAssetsToCSV(filteredAssets);
    toast.success(`Exported ${filteredAssets.length} asset(s) to CSV`);
  };

  const handleExportXLSX = () => {
    if (filteredAssets.length === 0) {
      toast.error("No assets to export");
      return;
    }
    exportAssetsToXLSX(filteredAssets);
    toast.success(`Exported ${filteredAssets.length} asset(s) to Excel`);
  };

  const handleExportSelected = (selected: AssetDTO[]) => {
    if (selected.length === 0) {
      toast.error("No assets selected");
      return;
    }
    exportAssetsToXLSX(selected, {
      filename: `assets-selected-${selected.length}`,
    });
  };

  const handleClearSelection = () => {
    setSelectedAssets([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Assets</h2>
          <p className="text-muted-foreground">
            {filteredAssets.length.toLocaleString()} asset
            {filteredAssets.length !== 1 ? "s" : ""}
            {assets.length !== filteredAssets.length &&
              ` (filtered from ${assets.length})`}
            {filters.searchTerm && ` • Search: "${filters.searchTerm}"`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission={PERMISSIONS.ASSETS_VIEW}>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.ASSETS_VIEW}>
            <Button
              variant="outline"
              onClick={handleExportXLSX}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.ASSETS_CREATE}>
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Bulk Import
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.ASSETS_CREATE}>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              New Asset
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Summary Cards */}
      <AssetsSummaryCards statistics={statistics} loading={statisticsLoading} />

      {/* Category Cards */}
      <AssetCategoryCards categories={categoryCards} />

      {/* Search and Filters Toolbar */}
      <AssetsToolbar
        filters={{
          searchTerm: filters.searchTerm,
          assetCategoryId: filters.filters.assetCategoryId,
          lifecycleStateId: filters.filters.lifecycleStateId,
          currentStockLocationId: filters.filters.currentStockLocationId,
          vendorId: filters.filters.vendorId,
          assignedUserTerm: filters.filters.assignedUserTerm,
          hostNameTerm: filters.filters.hostNameTerm,
        }}
        onSearchChange={filters.setSearchTerm}
        onFilterChange={(key, value) => {
          if (
            key === "assetCategoryId" ||
            key === "lifecycleStateId" ||
            key === "currentStockLocationId" ||
            key === "vendorId" ||
            key === "assignedUserTerm" ||
            key === "hostNameTerm"
          ) {
            filters.setFilter(key, value as string);
          }
        }}
        onClearFilters={filters.clearFilters}
        filterOptions={filterOptions}
        loading={isLoading}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedAssets={selectedAssets}
        onClearSelection={handleClearSelection}
        onSuccess={handleSuccess}
        onExportSelected={handleExportSelected}
        filterOptions={filterOptions}
      />

      {/* Assets Table */}
      <AssetsTable
        data={filteredAssets}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
        onSelectionChange={setSelectedAssets}
      />

      {/* Asset Form Dialog */}
      <AssetForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        asset={editingAsset}
      />

      {/* Bulk Import Dialog */}
      <ImportAssetsWizard
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

interface AssetCategoryCardItem {
  id: string;
  name: string;
  count: number;
}

interface AssetCategoryCardsProps {
  categories: AssetCategoryCardItem[];
}

function AssetCategoryCards({ categories }: AssetCategoryCardsProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Asset Categories</h3>
          <p className="text-muted-foreground text-sm">
            Inventory count by category
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="overflow-hidden transition-shadow hover:shadow-md"
          >
            <Link
              href={`/asset-categories/${category.id}`}
              className="focus-visible:ring-ring block w-full text-left focus-visible:ring-2 focus-visible:outline-none"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {category.name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Assets in category
                    </p>
                  </div>
                  <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                    <Package className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 text-3xl font-bold tabular-nums">
                  {category.count.toLocaleString()}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
