/**
 * Asset Kits Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AssetKitDTO } from "@/interface-adapters/dtos/generated/asset-kit.dto";
import type { AssetKitCheckoutDTO } from "@/interface-adapters/dtos/generated/asset-kit-checkout.dto";
import { listAssetKitsAction } from "@/interface-adapters/controllers/asset-kit.controller";
import { listKitCheckoutsAction } from "@/interface-adapters/controllers/asset-kit-checkout.controller";
import { AssetKitsTable } from "./asset-kits-table";
import { KitCheckoutsTable } from "./kit-checkouts-table";
import { KitForm } from "./kit-form";
import { KitDetail } from "./kit-detail";
import { CheckoutForm } from "./checkout-form";
import { CheckoutDetail } from "./checkout-detail";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetKitsPageClientProps {
  initialKits: AssetKitDTO[];
  initialCheckouts: AssetKitCheckoutDTO[];
}

export function AssetKitsPageClient({
  initialKits,
  initialCheckouts,
}: AssetKitsPageClientProps) {
  const [kits, setKits] = useState<AssetKitDTO[]>(initialKits);
  const [checkouts, setCheckouts] =
    useState<AssetKitCheckoutDTO[]>(initialCheckouts);
  const [isLoading, setIsLoading] = useState(false);
  const [isKitFormOpen, setIsKitFormOpen] = useState(false);
  const [isCheckoutFormOpen, setIsCheckoutFormOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState<AssetKitDTO | null>(null);
  const [selectedCheckout, setSelectedCheckout] =
    useState<AssetKitCheckoutDTO | null>(null);
  const [editingKit, setEditingKit] = useState<AssetKitDTO | null>(null);

  const loadKits = async () => {
    setIsLoading(true);
    try {
      const result = await listAssetKitsAction();
      if (result.success) {
        setKits(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load kits");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCheckouts = async () => {
    setIsLoading(true);
    try {
      const result = await listKitCheckoutsAction();
      if (result.success) {
        setCheckouts(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load checkouts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewKit = (kit: AssetKitDTO) => {
    setSelectedKit(kit);
  };

  const handleEditKit = (kit: AssetKitDTO) => {
    setEditingKit(kit);
    setIsKitFormOpen(true);
  };

  const handleViewCheckout = (checkout: AssetKitCheckoutDTO) => {
    setSelectedCheckout(checkout);
  };

  const handleKitFormClose = () => {
    setIsKitFormOpen(false);
    setEditingKit(null);
  };

  const handleSuccess = () => {
    loadKits();
    loadCheckouts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Asset Kits</h2>
          <p className="text-muted-foreground">
            Manage predefined asset bundles and checkouts
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission={PERMISSIONS.ASSET_KITS_CHECKOUT}>
            <Button
              onClick={() => setIsCheckoutFormOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Checkout
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.ASSET_KITS_CREATE}>
            <Button
              onClick={() => setIsKitFormOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              New Kit
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="kits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kits">Kits ({kits.length})</TabsTrigger>
          <TabsTrigger value="checkouts">
            Active Checkouts ({checkouts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kits" className="space-y-4">
          <AssetKitsTable
            data={kits}
            loading={isLoading}
            onView={handleViewKit}
            onEdit={handleEditKit}
            onRefresh={handleSuccess}
          />
        </TabsContent>

        <TabsContent value="checkouts" className="space-y-4">
          <KitCheckoutsTable
            data={checkouts}
            loading={isLoading}
            onView={handleViewCheckout}
            onRefresh={handleSuccess}
          />
        </TabsContent>
      </Tabs>

      {/* Kit Form Dialog */}
      <KitForm
        open={isKitFormOpen}
        onOpenChange={handleKitFormClose}
        onSuccess={handleSuccess}
        kit={editingKit}
      />

      {/* Kit Detail Dialog */}
      {selectedKit && (
        <KitDetail
          kit={selectedKit}
          onClose={() => setSelectedKit(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Checkout Form Dialog */}
      <CheckoutForm
        open={isCheckoutFormOpen}
        onOpenChange={setIsCheckoutFormOpen}
        onSuccess={handleSuccess}
      />

      {/* Checkout Detail Dialog */}
      {selectedCheckout && (
        <CheckoutDetail
          checkout={selectedCheckout}
          onClose={() => setSelectedCheckout(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
