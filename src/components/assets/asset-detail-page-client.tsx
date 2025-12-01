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
  Activity,
  MapPin,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatDate } from "@/lib/utils/date-format";
import {
  CountedTabs,
  type CountedTabConfig,
} from "@/components/ui/counted-tabs";

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
  const [isAssignmentLoading, setIsAssignmentLoading] = useState(true);

  // Tab counts for badges and quick stats
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
  const isLoadingCounts = tabCounts === null;

  // Fetch updated asset data from server
  const refreshAsset = useCallback(async () => {
    const result = await getAssetAction(asset.assetTag);
    if (result.success) {
      setAsset(result.data);
    }
    // Also refresh active assignment
    setIsAssignmentLoading(true);
    try {
      const assignmentResult = await getActiveAssignmentAction(asset.id);
      if (assignmentResult.success) {
        setActiveAssignment(assignmentResult.data);
      } else {
        setActiveAssignment(null);
      }
    } finally {
      setIsAssignmentLoading(false);
    }
  }, [asset.assetTag, asset.id]);

  // Fetch active assignment for Return Wizard
  useEffect(() => {
    const fetchActiveAssignment = async () => {
      setIsAssignmentLoading(true);
      try {
        const result = await getActiveAssignmentAction(asset.id);
        if (result.success) {
          setActiveAssignment(result.data);
        } else {
          setActiveAssignment(null);
        }
      } finally {
        setIsAssignmentLoading(false);
      }
    };

    fetchActiveAssignment();
  }, [asset.id]);

  // Fetch tab counts for badges and quick stats
  const fetchTabCounts = useCallback(async () => {
    try {
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
    } catch (_error) {
      setTabCounts({
        warranties: 0,
        assignments: 0,
        movements: 0,
        reservations: 0,
        cmdb: 0,
        services: 0,
        intune: 0,
      });
    }
  }, [asset.id, canViewCmdb, canViewIntune, canViewServices]);

  useEffect(() => {
    fetchTabCounts();
  }, [fetchTabCounts]);

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleSuccess = useCallback(async () => {
    // Fetch updated asset data to refresh UI immediately
    await refreshAsset();
    await fetchTabCounts();
    router.refresh();
  }, [fetchTabCounts, refreshAsset, router]);

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

  const cmdbCount = canViewCmdb && tabCounts ? tabCounts.cmdb : 0;
  const servicesCount = canViewServices && tabCounts ? tabCounts.services : 0;
  const intuneCount = canViewIntune && tabCounts ? tabCounts.intune : 0;
  const linkedBreakdown = [
    canViewCmdb ? `${cmdbCount} CMDB` : null,
    canViewServices ? `${servicesCount} services` : null,
    canViewIntune ? `${intuneCount} Intune` : null,
  ]
    .filter((entry) => entry !== null)
    .join(" • ");
  const linkedTotal = cmdbCount + servicesCount + intuneCount;
  const tabCount = (value: number | undefined) =>
    tabCounts === null ? undefined : (value ?? 0);
  const tabs: CountedTabConfig[] = [
    {
      value: "overview",
      label: "Overview",
      icon: Package,
      content: <AssetOverviewTab asset={asset} />,
      showWhenZero: true,
      triggerClassName: "gap-2",
    },
    {
      value: "warranties",
      label: "Warranties",
      icon: FileText,
      count: tabCount(tabCounts?.warranties),
      content: <AssetWarrantiesTab assetId={asset.id} />,
      triggerClassName: "gap-2",
    },
    {
      value: "assignments",
      label: "Assignments",
      icon: Users,
      count: tabCount(tabCounts?.assignments),
      content: <AssetAssignmentsTab assetId={asset.id} />,
      triggerClassName: "gap-2",
    },
    {
      value: "movements",
      label: "Movements",
      icon: TrendingUp,
      count: tabCount(tabCounts?.movements),
      content: <AssetMovementsTab assetId={asset.id} />,
      triggerClassName: "gap-2",
    },
    {
      value: "reservations",
      label: "Reservations",
      icon: Calendar,
      count: tabCount(tabCounts?.reservations),
      content: <AssetReservationsTab assetId={asset.id} />,
      triggerClassName: "gap-2",
    },
    {
      value: "cmdb",
      label: "CMDB",
      icon: Server,
      count: tabCount(tabCounts?.cmdb),
      canView: canViewCmdb,
      content: <AssetCmdbTab assetId={asset.id} />,
      triggerClassName: "gap-2",
    },
    {
      value: "services",
      label: "Services",
      icon: Globe,
      count: tabCount(tabCounts?.services),
      canView: canViewServices,
      content: <AssetServicesTab assetId={asset.id} />,
      triggerClassName: "gap-2",
    },
    {
      value: "intune",
      label: "Intune",
      icon: Laptop,
      count: tabCount(tabCounts?.intune),
      canView: canViewIntune,
      content: <AssetIntuneTab assetId={asset.id} />,
      triggerClassName: "gap-2",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/assets")}
              className="w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assets
            </Button>
            <div className="flex gap-4">
              <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-xl">
                <Package className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {asset.assetTag}
                  </h1>
                  {asset.lifecycleStateName && (
                    <Badge variant="secondary" className="gap-1">
                      <Activity className="h-3 w-3" />
                      {asset.lifecycleStateName}
                    </Badge>
                  )}
                  {asset.condition && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {asset.condition}
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">
                    {asset.modelName || "Model not set"}
                  </span>
                  {asset.categoryName && (
                    <>
                      <span className="text-muted-foreground/60">•</span>
                      <span>{asset.categoryName}</span>
                    </>
                  )}
                  {asset.serialNumber && (
                    <Badge
                      variant="outline"
                      className="bg-background font-mono text-xs"
                    >
                      S/N {asset.serialNumber}
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
                  {asset.vendorName && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {asset.vendorName}
                    </span>
                  )}
                  {asset.stockLocationName && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {asset.stockLocationName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {/* Workflow Actions */}
            <PermissionGuard permission={PERMISSIONS.ASSET_ASSIGNMENTS_CREATE}>
              <Button
                size="sm"
                onClick={() => setIsAssignWizardOpen(true)}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Assign to Employee
              </Button>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE}>
              <Button
                size="sm"
                onClick={() => setIsReturnWizardOpen(true)}
                variant="outline"
                className="gap-2"
                disabled={isAssignmentLoading || !activeAssignment}
                title={
                  activeAssignment || isAssignmentLoading
                    ? undefined
                    : "No active assignment to return"
                }
              >
                <RotateCcw className="h-4 w-4" />
                Return to Inventory
              </Button>
            </PermissionGuard>

            {/* Standard Actions */}
            <PermissionGuard permission={PERMISSIONS.ASSETS_UPDATE}>
              <Button
                size="sm"
                onClick={handleEdit}
                variant="outline"
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.ASSETS_DELETE}>
              <Button
                size="sm"
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

        {/* Quick status cards */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <div
                className={`rounded-full p-2 ${
                  activeAssignment
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                }`}
              >
                <Users className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">
                  Assignment
                </p>
                <p className="leading-tight font-semibold">
                  {isAssignmentLoading
                    ? "Checking assignment..."
                    : activeAssignment
                      ? activeAssignment.assigneeName ||
                        activeAssignment.assigneeId
                      : "Unassigned"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {isAssignmentLoading
                    ? "Fetching current assignment"
                    : activeAssignment
                      ? `Since ${formatDate(activeAssignment.startDate)}`
                      : "Assign this asset to put it in use"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">
                  Inventory
                </p>
                <p className="leading-tight font-semibold">
                  {asset.stockLocationName || "No stock location"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {isLoadingCounts
                    ? "Loading movements..."
                    : `${tabCounts?.movements ?? 0} movement${
                        (tabCounts?.movements ?? 0) === 1 ? "" : "s"
                      } logged`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">
                  Coverage
                </p>
                <p className="leading-tight font-semibold">
                  {isLoadingCounts
                    ? "Loading warranties..."
                    : `${tabCounts?.warranties ?? 0} warrant${
                        (tabCounts?.warranties ?? 0) === 1 ? "y" : "ies"
                      }`}
                </p>
                <p className="text-muted-foreground text-xs">
                  {isLoadingCounts
                    ? "Loading reservations..."
                    : `${tabCounts?.reservations ?? 0} reservation${
                        (tabCounts?.reservations ?? 0) === 1 ? "" : "s"
                      } in history`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-full bg-purple-100 p-2 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                <Server className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">
                  Linked Items
                </p>
                <p className="leading-tight font-semibold">
                  {isLoadingCounts
                    ? "Loading links..."
                    : canViewCmdb || canViewServices || canViewIntune
                      ? `${linkedTotal} linked item${
                          linkedTotal === 1 ? "" : "s"
                        }`
                      : "Access limited"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {isLoadingCounts
                    ? "Loading linked records..."
                    : canViewCmdb || canViewServices || canViewIntune
                      ? linkedBreakdown || "No linked records"
                      : "Request access to view services or devices"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CountedTabs
        defaultValue="overview"
        tabs={tabs}
        loading={isLoadingCounts}
        tabsClassName="space-y-6"
        listClassName="h-auto gap-2"
      />

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
