/**
 * Vendors Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { VendorsTable } from "./vendors-table";
import { VendorForm } from "./vendor-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface VendorsPageClientProps {
  initialVendors: VendorDTO[];
}

export function VendorsPageClient({ initialVendors }: VendorsPageClientProps) {
  const [vendors, setVendors] = useState<VendorDTO[]>(initialVendors);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorDTO | null>(null);

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const result = await listVendorsAction();
      if (result.success) {
        setVendors(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vendor: VendorDTO) => {
    setEditingVendor(vendor);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingVendor(null);
  };

  const handleSuccess = () => {
    loadVendors();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendors</h2>
          <p className="text-muted-foreground">
            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.VENDORS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Vendor
          </Button>
        </PermissionGuard>
      </div>

      {/* Vendors Table */}
      <VendorsTable
        data={vendors}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Vendor Form Dialog */}
      <VendorForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        vendor={editingVendor}
      />
    </div>
  );
}
