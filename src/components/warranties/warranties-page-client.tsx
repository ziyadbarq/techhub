/**
 * Warranties Page Client Component
 * Orchestrates warranty list and CRUD operations
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { WarrantyDTO } from "@/interface-adapters/presenters/warranty.presenter";
import { listWarrantiesAction } from "@/interface-adapters/controllers/warranty.controller";
import { WarrantiesTable } from "./warranties-table";
import { WarrantyForm } from "./warranty-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface WarrantiesPageClientProps {
  initialWarranties: WarrantyDTO[];
}

export function WarrantiesPageClient({
  initialWarranties,
}: WarrantiesPageClientProps) {
  const [warranties, setWarranties] =
    useState<WarrantyDTO[]>(initialWarranties);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<WarrantyDTO | null>(
    null,
  );

  const loadWarranties = async () => {
    setIsLoading(true);
    try {
      const result = await listWarrantiesAction();
      if (result.success) {
        setWarranties(result.data.warranties);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load warranties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (warranty: WarrantyDTO) => {
    setEditingWarranty(warranty);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingWarranty(null);
  };

  const handleSuccess = () => {
    loadWarranties();
  };

  // Count warranties by status
  const activeCount = warranties.filter((w) => w.isActive).length;
  const expiringCount = warranties.filter((w) => w.isExpiringSoon).length;
  const expiredCount = warranties.filter((w) => w.isExpired).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Warranties</h2>
          <p className="text-muted-foreground">
            {warranties.length} total{" "}
            {activeCount > 0 && `• ${activeCount} active`}
            {expiringCount > 0 && ` • ${expiringCount} expiring soon`}
            {expiredCount > 0 && ` • ${expiredCount} expired`}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.WARRANTIES_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Warranty
          </Button>
        </PermissionGuard>
      </div>

      {/* Warranties Table */}
      <WarrantiesTable
        data={warranties}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Warranty Form Dialog */}
      <WarrantyForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        warranty={editingWarranty}
      />
    </div>
  );
}
