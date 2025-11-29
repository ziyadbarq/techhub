/**
 * Asset Detail Page Client Component
 */

"use client";
import { useState, useEffect, useCallback } from "react";
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
import {
  deleteAssetAction,
  getAssetAction,
} from "@/interface-adapters/controllers/asset.controller";
import {
  getActiveAssignmentAction,
  listAssetAssignmentsAction,
} from "@/interface-adapters/controllers/asset-assignment.controller";
import { listWarrantiesByAssetAction } from "@/interface-adapters/controllers/warranty.controller";
import { listStockMovementsAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { listReservationsByAssetAction } from "@/interface-adapters/controllers/asset-reservation.controller";
import { listConfigurationItemsAction } from "@/interface-adapters/controllers/configuration-item.controller";
import { getAssetServicesAction } from "@/interface-adapters/controllers/service-asset.controller";
import { getIntuneDevicesByAssetAction } from "@/interface-adapters/controllers/intune-device.controller";
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
  const [asset, setAsset] = useState(initialAsset);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssignWizardOpen, setIsAssignWizardOpen] = useState(false);
  const [isReturnWizardOpen, setIsReturnWizardOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] =
    useState<AssetAssignmentDTO | null>(null);

  // Tab counts for hiding empty tabs
  const [tabCounts, setTabCounts] = useState<{
    warranties: number;
    assignments: number;
    movements: number;
    reservations: number;
    cmdb: number;
    services: number;
    intune: number;
  } | null>(null);

  // Permission checks for additional tabs
  const canViewCmdb = hasPermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);
  const canViewServices = hasPermission(PERMISSIONS.SERVICES_VIEW);
  const canViewIntune = hasPermission(PERMISSIONS.INTUNE_DEVICES_VIEW);

  // Fetch updated asset data from server
  const refreshAsset = useCallback(async () => {
    const result = await getAssetAction(asset.assetTag);
    if (result.success) {
      setAsset(result.data);
    }
    // Also refresh active assignment
    const assignmentResult = await getActiveAssignmentAction(asset.id);
    if (assignmentResult.success) {
      setActiveAssignment(assignmentResult.data);
    } else {
      setActiveAssignment(null);
    }
  }, [asset.assetTag, asset.id]);

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

  // Fetch tab counts to hide empty tabs
  useEffect(() => {
    const fetchTabCounts = async () => {
      const [
        warrantiesResult,
        assignmentsResult,
        movementsResult,
        reservationsResult,
        cmdbResult,
        servicesResult,
        intuneResult,
      ] = await Promise.all([
        listWarrantiesByAssetAction(asset.id),
        listAssetAssignmentsAction({ assetId: asset.id }),
        listStockMovementsAction({ assetId: asset.id }),
        listReservationsByAssetAction(asset.id),
        canViewCmdb
          ? listConfigurationItemsAction({ linkedAssetId: asset.id })
          : Promise.resolve({ success: true, data: [] }),
        canViewServices
          ? getAssetServicesAction(asset.id)
          : Promise.resolve({ success: true, data: [] }),
        canViewIntune
          ? getIntuneDevicesByAssetAction(asset.id)
          : Promise.resolve({ success: true, data: [] }),
      ]);

      setTabCounts({
        warranties: warrantiesResult.success ? warrantiesResult.data.length : 0,
        assignments: assignmentsResult.success
          ? assignmentsResult.data.length
          : 0,
        movements: movementsResult.success ? movementsResult.data.length : 0,
        reservations: reservationsResult.success
          ? reservationsResult.data.length
          : 0,
        cmdb: cmdbResult.success ? cmdbResult.data.length : 0,
        services: servicesResult.success ? servicesResult.data.length : 0,
        intune: intuneResult.success ? intuneResult.data.length : 0,
      });
    };

    fetchTabCounts();
  }, [asset.id, canViewCmdb, canViewServices, canViewIntune]);

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleSuccess = useCallback(async () => {
    // Fetch updated asset data to refresh UI immediately
    await refreshAsset();
    router.refresh();
  }, [refreshAsset, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAssetAction(asset.assetTag);
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
          {/* Overview - always shown */}
          <TabsTrigger value="overview" className="gap-2">
            <Package className="h-4 w-4" />
            Overview
          </TabsTrigger>

          {/* Warranties - hide if empty */}
          {(!tabCounts || tabCounts.warranties > 0) && (
            <TabsTrigger value="warranties" className="gap-2">
              <FileText className="h-4 w-4" />
              Warranties
              {tabCounts && tabCounts.warranties > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {tabCounts.warranties}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {/* Assignments - hide if empty */}
          {(!tabCounts || tabCounts.assignments > 0) && (
            <TabsTrigger value="assignments" className="gap-2">
              <Users className="h-4 w-4" />
              Assignments
              {tabCounts && tabCounts.assignments > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {tabCounts.assignments}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {/* Movements - hide if empty */}
          {(!tabCounts || tabCounts.movements > 0) && (
            <TabsTrigger value="movements" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Movements
              {tabCounts && tabCounts.movements > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {tabCounts.movements}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {/* Reservations - hide if empty */}
          {(!tabCounts || tabCounts.reservations > 0) && (
            <TabsTrigger value="reservations" className="gap-2">
              <Calendar className="h-4 w-4" />
              Reservations
              {tabCounts && tabCounts.reservations > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {tabCounts.reservations}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {/* CMDB - hide if empty or no permission */}
          {canViewCmdb && (!tabCounts || tabCounts.cmdb > 0) && (
            <TabsTrigger value="cmdb" className="gap-2">
              <Server className="h-4 w-4" />
              CMDB
              {tabCounts && tabCounts.cmdb > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {tabCounts.cmdb}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {/* Services - hide if empty or no permission */}
          {canViewServices && (!tabCounts || tabCounts.services > 0) && (
            <TabsTrigger value="services" className="gap-2">
              <Globe className="h-4 w-4" />
              Services
              {tabCounts && tabCounts.services > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {tabCounts.services}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {/* Intune - hide if empty or no permission */}
          {canViewIntune && (!tabCounts || tabCounts.intune > 0) && (
            <TabsTrigger value="intune" className="gap-2">
              <Laptop className="h-4 w-4" />
              Intune
              {tabCounts && tabCounts.intune > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {tabCounts.intune}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <AssetOverviewTab asset={asset} />
        </TabsContent>

        {(!tabCounts || tabCounts.warranties > 0) && (
          <TabsContent value="warranties">
            <AssetWarrantiesTab assetId={asset.id} />
          </TabsContent>
        )}

        {(!tabCounts || tabCounts.assignments > 0) && (
          <TabsContent value="assignments">
            <AssetAssignmentsTab assetId={asset.id} />
          </TabsContent>
        )}

        {(!tabCounts || tabCounts.movements > 0) && (
          <TabsContent value="movements">
            <AssetMovementsTab assetId={asset.id} />
          </TabsContent>
        )}

        {(!tabCounts || tabCounts.reservations > 0) && (
          <TabsContent value="reservations">
            <AssetReservationsTab assetId={asset.id} />
          </TabsContent>
        )}

        {canViewCmdb && (!tabCounts || tabCounts.cmdb > 0) && (
          <TabsContent value="cmdb">
            <AssetCmdbTab assetId={asset.id} />
          </TabsContent>
        )}

        {canViewServices && (!tabCounts || tabCounts.services > 0) && (
          <TabsContent value="services">
            <AssetServicesTab assetId={asset.id} />
          </TabsContent>
        )}

        {canViewIntune && (!tabCounts || tabCounts.intune > 0) && (
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
