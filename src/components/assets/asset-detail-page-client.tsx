/**
 * Asset Detail Page Client Component
 */

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  FileText,
  Users,
  TrendingUp,
  UserPlus,
  RotateCcw,
  Calendar,
  Server,
  Globe,
  Laptop,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { AssetAssignmentDTO } from "@/interface-adapters/presenters/asset-assignment.presenter";
import { deleteAssetAction } from "@/interface-adapters/controllers/asset.controller";
import { getActiveAssignmentAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { AssetForm } from "./asset-form";
import { AssetOverviewTab } from "./asset-overview-tab";
import { AssetWarrantiesTab } from "./asset-warranties-tab";
import { AssetAssignmentsTab } from "./asset-assignments-tab";
import { AssetMovementsTab } from "./asset-movements-tab";
import { AssetReservationsTab } from "./asset-reservations-tab";
import { AssetCmdbTab } from "./asset-cmdb-tab";
import { AssetServicesTab } from "./asset-services-tab";
import { AssetIntuneTab } from "./asset-intune-tab";
import { AssignAssetWizard } from "./assign-asset-wizard";
import { ReturnAssetWizard } from "./return-asset-wizard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetDetailPageClientProps {
  asset: AssetDTO;
}

export function AssetDetailPageClient({
  asset: initialAsset,
}: AssetDetailPageClientProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const asset = initialAsset;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssignWizardOpen, setIsAssignWizardOpen] = useState(false);
  const [isReturnWizardOpen, setIsReturnWizardOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] =
    useState<AssetAssignmentDTO | null>(null);

  // Permission checks for additional tabs
  const canViewCmdb = hasPermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);
  const canViewServices = hasPermission(PERMISSIONS.SERVICES_VIEW);
  const canViewIntune = hasPermission(PERMISSIONS.INTUNE_DEVICES_VIEW);

  // Fetch active assignment for Return Wizard
  useEffect(() => {
    const fetchActiveAssignment = async () => {
      const result = await getActiveAssignmentAction(asset.id);
      if (result.success) {
        setActiveAssignment(result.data);
      }
    };

    fetchActiveAssignment();
  }, [asset.id]);

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleSuccess = () => {
    // Reload the page to get fresh data
    router.refresh();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAssetAction(asset.id);
      if (result.success) {
        toast.success("Asset deleted successfully");
        router.push("/assets");
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete asset");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/assets")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Button>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{asset.assetTag}</h1>
            {asset.isUnderWarranty && (
              <Badge variant="default" className="gap-1">
                <FileText className="h-3 w-3" />
                Under Warranty
              </Badge>
            )}
          </div>

          <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
            {asset.categoryName && (
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {asset.categoryName}
              </span>
            )}
            {asset.serialNumber && <span>S/N: {asset.serialNumber}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Workflow Actions */}
          <PermissionGuard permission={PERMISSIONS.ASSET_ASSIGNMENTS_CREATE}>
            <Button
              onClick={() => setIsAssignWizardOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Assign to Employee
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE}>
            <Button
              onClick={() => setIsReturnWizardOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Return to Inventory
            </Button>
          </PermissionGuard>

          {/* Standard Actions */}
          <PermissionGuard permission={PERMISSIONS.ASSETS_UPDATE}>
            <Button onClick={handleEdit} variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={PERMISSIONS.ASSETS_DELETE}>
            <Button
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="overview" className="gap-2">
            <Package className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="warranties" className="gap-2">
            <FileText className="h-4 w-4" />
            Warranties
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Users className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Movements
          </TabsTrigger>
          <TabsTrigger value="reservations" className="gap-2">
            <Calendar className="h-4 w-4" />
            Reservations
          </TabsTrigger>
          {canViewCmdb && (
            <TabsTrigger value="cmdb" className="gap-2">
              <Server className="h-4 w-4" />
              CMDB
            </TabsTrigger>
          )}
          {canViewServices && (
            <TabsTrigger value="services" className="gap-2">
              <Globe className="h-4 w-4" />
              Services
            </TabsTrigger>
          )}
          {canViewIntune && (
            <TabsTrigger value="intune" className="gap-2">
              <Laptop className="h-4 w-4" />
              Intune
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <AssetOverviewTab asset={asset} />
        </TabsContent>

        <TabsContent value="warranties">
          <AssetWarrantiesTab assetId={asset.id} />
        </TabsContent>

        <TabsContent value="assignments">
          <AssetAssignmentsTab assetId={asset.id} />
        </TabsContent>

        <TabsContent value="movements">
          <AssetMovementsTab assetId={asset.id} />
        </TabsContent>

        <TabsContent value="reservations">
          <AssetReservationsTab assetId={asset.id} />
        </TabsContent>

        {canViewCmdb && (
          <TabsContent value="cmdb">
            <AssetCmdbTab assetId={asset.id} />
          </TabsContent>
        )}

        {canViewServices && (
          <TabsContent value="services">
            <AssetServicesTab assetId={asset.id} />
          </TabsContent>
        )}

        {canViewIntune && (
          <TabsContent value="intune">
            <AssetIntuneTab assetId={asset.id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Form Dialog */}
      <AssetForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        asset={asset}
      />

      {/* Assign Asset Wizard */}
      <AssignAssetWizard
        assetId={asset.id}
        assetTag={asset.assetTag}
        currentStockLocationId={asset.currentStockLocationId}
        open={isAssignWizardOpen}
        onOpenChange={setIsAssignWizardOpen}
        onSuccess={handleSuccess}
      />

      {/* Return Asset Wizard */}
      <ReturnAssetWizard
        assetId={asset.id}
        assetTag={asset.assetTag}
        assignmentId={activeAssignment?.id || ""}
        assignedToName={
          activeAssignment
            ? `${activeAssignment.assigneeType}: ${activeAssignment.assigneeName || activeAssignment.assigneeId}`
            : undefined
        }
        open={isReturnWizardOpen}
        onOpenChange={setIsReturnWizardOpen}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete asset &quot;{asset.assetTag}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
