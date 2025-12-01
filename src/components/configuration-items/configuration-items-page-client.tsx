/**
 * Configuration Items Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ConfigurationItemDTO } from "@/interface-adapters/dtos/generated/configuration-item.dto";
import { listConfigurationItemsAction } from "@/interface-adapters/controllers/configuration-item.controller";
import { ConfigurationItemsTable } from "./configuration-items-table";
import { ConfigurationItemForm } from "./configuration-item-form";
import { ConfigurationItemDetail } from "./configuration-item-detail";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export interface ConfigurationItemsViewState {
  search?: string;
  criticality?: string;
  environment?: string;
  owner?: string;
  assetLink?: string;
  density?: "comfortable" | "compact";
}

interface ConfigurationItemsPageClientProps {
  initialItems: ConfigurationItemDTO[];
  initialViewState?: ConfigurationItemsViewState;
}

export function ConfigurationItemsPageClient({
  initialItems,
  initialViewState,
}: ConfigurationItemsPageClientProps) {
  const [items, setItems] = useState<ConfigurationItemDTO[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConfigurationItemDTO | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<ConfigurationItemDTO | null>(
    null,
  );

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const result = await listConfigurationItemsAction();
      if (result.success) {
        setItems(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load configuration items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (item: ConfigurationItemDTO) => {
    setSelectedItem(item);
  };

  const handleEdit = (item: ConfigurationItemDTO) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleSuccess = () => {
    loadItems();
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Configuration Items</h2>
          <p className="text-muted-foreground">
            {items.length} configuration item{items.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission={PERMISSIONS.CONFIGURATION_ITEMS_CREATE}>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              New Configuration Item
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Configuration Items Table */}
      <ConfigurationItemsTable
        data={items}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
        initialViewState={initialViewState}
      />

      {/* Configuration Item Form Dialog */}
      <ConfigurationItemForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        editingItem={editingItem}
      />

      {/* Configuration Item Detail Dialog */}
      {selectedItem && (
        <ConfigurationItemDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
