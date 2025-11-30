"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LicenseProductsTable } from "@/components/license-products/license-products-table";
import { LicenseProductForm } from "@/components/license-products/license-product-form";
import type { LicenseProductDTO } from "@/interface-adapters/presenters/license-product.presenter";
import { listLicenseProducts } from "@/interface-adapters/controllers/license-product.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

export function LicenseProductsPageClient() {
  const [licenseProducts, setLicenseProducts] = React.useState<
    LicenseProductDTO[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] =
    React.useState<LicenseProductDTO | null>(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.LICENSE_PRODUCTS_CREATE);

  const loadLicenseProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listLicenseProducts();
      if (result.success) {
        setLicenseProducts(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadLicenseProducts();
  }, [loadLicenseProducts]);

  const handleEdit = (licenseProduct: LicenseProductDTO) => {
    setEditingProduct(licenseProduct);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            License Products
          </h1>
          <p className="text-muted-foreground">
            Manage software license products and metrics
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New License Product
          </Button>
        )}
      </div>

      <LicenseProductsTable
        data={licenseProducts}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={loadLicenseProducts}
      />

      <LicenseProductForm
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProduct(null);
          }
          setFormOpen(open);
        }}
        onSuccess={loadLicenseProducts}
        licenseProduct={editingProduct}
      />
    </div>
  );
}
