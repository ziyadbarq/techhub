/**
 * License Entitlement Detail Component
 */

"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Package,
  Calendar,
  FileText,
  Hash,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { LicenseEntitlementDTO } from "@/interface-adapters/dtos/generated/license-entitlement.dto";
import type { LicenseProductDTO } from "@/interface-adapters/presenters/license-product.presenter";
import type { ContractDTO } from "@/interface-adapters/presenters/contract.presenter";
import { deleteLicenseEntitlement } from "@/interface-adapters/controllers/license-entitlement.controller";
import { getLicenseProduct } from "@/interface-adapters/controllers/license-product.controller";
import { getContract } from "@/interface-adapters/controllers/contract.controller";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { EntitlementCostDisplay } from "./entitlement-cost-display";
import { EntitlementAddonsPanel } from "./entitlement-addons-panel";

interface LicenseEntitlementDetailProps {
  entitlement: LicenseEntitlementDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (entitlement: LicenseEntitlementDTO) => void;
  onDeleted: () => void;
}

export function LicenseEntitlementDetail({
  entitlement,
  open,
  onOpenChange,
  onEdit,
  onDeleted,
}: LicenseEntitlementDetailProps) {
  const [product, setProduct] = React.useState<LicenseProductDTO | null>(null);
  const [contract, setContract] = React.useState<ContractDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(PERMISSIONS.LICENSE_ENTITLEMENTS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.LICENSE_ENTITLEMENTS_DELETE);

  // Load related data
  React.useEffect(() => {
    async function loadRelatedData() {
      if (!entitlement) return;

      setLoading(true);
      try {
        const [productResult, contractResult] = await Promise.all([
          getLicenseProduct(entitlement.licenseProductId),
          entitlement.contractId
            ? getContract(entitlement.contractId)
            : Promise.resolve(null),
        ]);

        if (productResult?.success) {
          setProduct(productResult.data);
        }
        if (contractResult?.success) {
          setContract(contractResult.data);
        }
      } finally {
        setLoading(false);
      }
    }

    if (open && entitlement) {
      void loadRelatedData();
    }
  }, [open, entitlement]);

  const handleDelete = async () => {
    if (!entitlement) return;

    setDeleting(true);
    try {
      const result = await deleteLicenseEntitlement(entitlement.id);
      if (result.success) {
        toast.success("License entitlement deleted successfully");
        setDeleteDialogOpen(false);
        onOpenChange(false);
        onDeleted();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!entitlement) return null;

  const getStatusBadge = () => {
    if (entitlement.isExpired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (entitlement.isActive) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl md:max-w-2xl">
          <SheetHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-xl">
                  {loading
                    ? "Loading..."
                    : (product?.name ?? "License Entitlement")}
                </SheetTitle>
                <SheetDescription>
                  Entitlement details and cost tracking
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Product Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  License Product
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : product ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Name
                      </span>
                      <span className="text-sm font-medium">
                        {product.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Code
                      </span>
                      <span className="text-sm">{product.code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Metric Type
                      </span>
                      <Badge variant="outline">{product.metricType}</Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Product not found
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quantity and Dates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="h-4 w-4" />
                  Entitlement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Purchased Quantity
                  </span>
                  <span className="text-sm font-medium">
                    {entitlement.purchasedQuantity.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Effective Start
                  </span>
                  <span className="text-sm">
                    {format(
                      new Date(entitlement.effectiveStart),
                      "MMM d, yyyy",
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Effective End
                  </span>
                  <span className="text-sm">
                    {entitlement.effectiveEnd
                      ? format(
                          new Date(entitlement.effectiveEnd),
                          "MMM d, yyyy",
                        )
                      : "Perpetual"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contract Info */}
            {contract && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Linked Contract
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Contract Number
                    </span>
                    <span className="text-sm font-medium">
                      {contract.contractNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Name</span>
                    <span className="text-sm">{contract.name}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cost Display */}
            <EntitlementCostDisplay
              entitlementId={entitlement.id}
              unitCost={entitlement.unitCost}
              currency={entitlement.currency}
              purchasedQuantity={entitlement.purchasedQuantity}
            />

            {/* Addons Panel */}
            <EntitlementAddonsPanel
              entitlementId={entitlement.id}
              licenseProductId={entitlement.licenseProductId}
            />

            {/* Notes */}
            {entitlement.note && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {entitlement.note}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              {canEdit && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(entitlement);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete License Entitlement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this license entitlement? This
              action cannot be undone and will remove all associated allocation
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
