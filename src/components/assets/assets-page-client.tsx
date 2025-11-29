/**
 * Assets Page Client Component
 *
 * Full-featured assets management page with:
 * - Summary statistics cards
 * - Search and filter toolbar
 * - Server-side pagination
 * - Bulk actions (delete, status change, export)
 * - Column visibility persistence
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { PaginationState } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import {
  listAssetsPaginatedAction,
  getAssetStatisticsAction,
  getAssetFilterOptionsAction,
  type AssetFilterOptions,
  type PaginatedAssetsResponse,
} from "@/interface-adapters/controllers/asset.controller";
import type { AssetStatistics } from "@/core/repositories/asset.repository.interface";

import { AssetsTable } from "./assets-table";
import { AssetForm } from "./asset-form";
import { AssetsSummaryCards } from "./assets-summary-cards";
import { AssetsToolbar } from "./assets-toolbar";
import { BulkActionBar } from "./bulk-action-bar";
import { AssetsPageSkeleton } from "./assets-table-skeleton";

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { exportAssetsToCSV } from "@/lib/csv-export";
import { exportAssetsToXLSX } from "@/lib/xlsx-export";
import { useAssetsFilters } from "@/hooks/use-assets-filters";

interface AssetsPageClientProps {
  /** Initial paginated data from server */
  initialData?: PaginatedAssetsResponse;
  /** Initial statistics from server */
  initialStatistics?: AssetStatistics;
  /** Initial filter options from server */
  initialFilterOptions?: AssetFilterOptions;
}

export function AssetsPageClient({
  initialData,
  initialStatistics,
  initialFilterOptions,
}: AssetsPageClientProps) {
  // Assets data state
  const [assets, setAssets] = useState<AssetDTO[]>(initialData?.assets ?? []);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages ?? 1);

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
  const [editingAsset, setEditingAsset] = useState<AssetDTO | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<AssetDTO[]>([]);

  // Filter and pagination state
  const {
    filters,
    debouncedSearchTerm,
    pagination,
    setSearchTerm,
    setFilter,
    clearFilters,
    setPage,
    setPageSize,
    searchOptions,
  } = useAssetsFilters(undefined, {
    page: initialData?.page ?? 1,
    pageSize: initialData?.pageSize ?? 20,
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
      const result = await listAssetsPaginatedAction(searchOptions, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (result.success && result.data) {
        setAssets(result.data.assets);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
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
  }, [searchOptions, pagination.page, pagination.pageSize]);

  const loadStatistics = useCallback(async () => {
    setStatisticsLoading(true);
    try {
      const result = await getAssetStatisticsAction(searchOptions);
      if (result.success && result.data) {
        setStatistics(result.data);
      }
    } catch {
      // Silently fail - stats will show loading state
    } finally {
      setStatisticsLoading(false);
    }
  }, [searchOptions]);

  // Load filter options on mount if not provided
  useEffect(() => {
    if (!initialFilterOptions) {
      loadFilterOptions();
    }
  }, [initialFilterOptions]);

  // Load assets when filters or pagination change
  useEffect(() => {
    loadAssets();
  }, [
    loadAssets,
    debouncedSearchTerm,
    filters.assetCategoryId,
    filters.lifecycleStateId,
    filters.currentStockLocationId,
    filters.vendorId,
    pagination.page,
    pagination.pageSize,
  ]);

  // Load statistics when filters change (debounced search term triggers this)
  useEffect(() => {
    loadStatistics();
  }, [
    loadStatistics,
    debouncedSearchTerm,
    filters.assetCategoryId,
    filters.lifecycleStateId,
    filters.currentStockLocationId,
    filters.vendorId,
  ]);

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

  const handlePaginationChange = (paginationState: PaginationState) => {
    setPage(paginationState.pageIndex + 1);
    setPageSize(paginationState.pageSize);
  };

  const handleExportCSV = () => {
    if (assets.length === 0) {
      toast.error("No assets to export");
      return;
    }
    exportAssetsToCSV(assets);
    toast.success(`Exported ${assets.length} asset(s) to CSV`);
  };

  const handleExportXLSX = () => {
    if (assets.length === 0) {
      toast.error("No assets to export");
      return;
    }
    exportAssetsToXLSX(assets);
    toast.success(`Exported ${assets.length} asset(s) to Excel`);
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

  // Show skeleton on initial load
  if (!initialData && isLoading && assets.length === 0) {
    return <AssetsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Assets</h2>
          <p className="text-muted-foreground">
            {total.toLocaleString()} asset{total !== 1 ? "s" : ""} total
            {filters.searchTerm && ` • Filtered by "${filters.searchTerm}"`}
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

      {/* Search and Filters Toolbar */}
      <AssetsToolbar
        filters={filters}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
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
        data={assets}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
        onSelectionChange={setSelectedAssets}
        pagination={{
          pageIndex: pagination.page - 1,
          pageSize: pagination.pageSize,
          pageCount: totalPages,
          total,
          onPaginationChange: handlePaginationChange,
        }}
      />

      {/* Asset Form Dialog */}
      <AssetForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        asset={editingAsset}
      />
    </div>
  );
}
