/**
 * Asset Warranty Panel Component
 * Displays warranties for a specific asset with inline management
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Shield, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { WarrantyDTO } from "@/interface-adapters/presenters/warranty.presenter";
import { listWarrantiesByAssetAction } from "@/interface-adapters/controllers/warranty.controller";
import { WarrantyForm } from "./warranty-form";
import { WarrantiesTable } from "./warranties-table";
import { WarrantyStatusBadge } from "./warranty-status-badge";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetWarrantyPanelProps {
  assetId: string;
  assetTag?: string;
  compact?: boolean; // If true, shows compact card view; if false, shows table view
}

export function AssetWarrantyPanel({
  assetId,
  assetTag,
  compact = true,
}: AssetWarrantyPanelProps) {
  const [warranties, setWarranties] = useState<WarrantyDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<WarrantyDTO | null>(
    null,
  );

  const loadWarranties = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listWarrantiesByAssetAction(assetId);
      if (result.success) {
        setWarranties(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load warranties");
    } finally {
      setIsLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadWarranties();
  }, [loadWarranties]);

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

  const activeWarranty = warranties.find((w) => w.isActive && !w.isExpired);

  if (compact) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Warranties
                </CardTitle>
                <CardDescription>
                  {warranties.length === 0
                    ? "No warranties on record"
                    : `${warranties.length} warranty record${warranties.length !== 1 ? "s" : ""}`}
                </CardDescription>
              </div>
              <PermissionGuard permission={PERMISSIONS.WARRANTIES_CREATE}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </PermissionGuard>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : warranties.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No warranty information available for this asset.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Active Warranty Summary */}
                {activeWarranty && (
                  <div className="bg-card rounded-lg border p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">Current Coverage</p>
                        <p className="text-muted-foreground text-xs">
                          {activeWarranty.policyReference ||
                            "No policy reference"}
                        </p>
                      </div>
                      <WarrantyStatusBadge
                        isActive={activeWarranty.isActive}
                        isExpired={activeWarranty.isExpired}
                        isExpiringSoon={activeWarranty.isExpiringSoon}
                        daysRemaining={activeWarranty.daysRemaining}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(
                            new Date(activeWarranty.startDate),
                            "MMM d, yyyy",
                          )}{" "}
                          →{" "}
                          {format(
                            new Date(activeWarranty.endDate),
                            "MMM d, yyyy",
                          )}
                        </span>
                      </div>
                      {activeWarranty.cost && (
                        <div className="text-muted-foreground flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: activeWarranty.currency || "USD",
                            }).format(activeWarranty.cost)}
                          </span>
                        </div>
                      )}
                    </div>
                    {activeWarranty.vendorName && (
                      <div className="mt-2 border-t pt-2">
                        <p className="text-muted-foreground text-xs">
                          Provider: {activeWarranty.vendorName}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* All Warranties List */}
                {warranties.length > 1 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-sm font-medium">All Warranties</p>
                      <div className="space-y-2">
                        {warranties.map((warranty) => (
                          <div
                            key={warranty.id}
                            className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-md border p-2 text-sm"
                            onClick={() => handleEdit(warranty)}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {warranty.policyReference || "No reference"}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {format(
                                  new Date(warranty.endDate),
                                  "MMM d, yyyy",
                                )}
                              </span>
                            </div>
                            <WarrantyStatusBadge
                              isActive={warranty.isActive}
                              isExpired={warranty.isExpired}
                              isExpiringSoon={warranty.isExpiringSoon}
                              daysRemaining={warranty.daysRemaining}
                              showIcon={false}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warranty Form Dialog */}
        <WarrantyForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          onSuccess={handleSuccess}
          warranty={editingWarranty}
          preselectedAssetId={assetId}
        />
      </>
    );
  }

  // Table view for detailed pages
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Warranties</h3>
            <p className="text-muted-foreground text-sm">
              Warranty coverage for {assetTag || "this asset"}
            </p>
          </div>
          <PermissionGuard permission={PERMISSIONS.WARRANTIES_CREATE}>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Warranty
            </Button>
          </PermissionGuard>
        </div>

        <WarrantiesTable
          data={warranties}
          loading={isLoading}
          onEdit={handleEdit}
          onRefresh={handleSuccess}
          showAssetColumn={false} // Hide asset column since we're viewing a specific asset
        />
      </div>

      {/* Warranty Form Dialog */}
      <WarrantyForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        warranty={editingWarranty}
        preselectedAssetId={assetId}
      />
    </>
  );
}
