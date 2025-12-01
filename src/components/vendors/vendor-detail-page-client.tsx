/**
 * Vendor Detail Page Client
 *
 * Client component for displaying a vendor's 360-degree view.
 * Includes quick stats, tabs for different data categories, and action buttons.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  FileText,
  Shield,
  Package,
  Mail,
  Phone,
  Globe,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Star,
  DollarSign,
} from "lucide-react";
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
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import type {
  VendorRelationCounts,
  VendorStatistics,
} from "@/interface-adapters/controllers/vendor-details.controller";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  deleteVendorAction,
  getVendorAction,
} from "@/interface-adapters/controllers/vendor.controller";
import { VendorForm } from "@/components/vendors/vendor-form";
import { VendorOverviewTab } from "@/components/vendors/tabs/vendor-overview-tab";
import { VendorContactsTab } from "@/components/vendors/tabs/vendor-contacts-tab";
import { VendorProductsTab } from "@/components/vendors/tabs/vendor-products-tab";
import { VendorAssetsTab } from "@/components/vendors/tabs/vendor-assets-tab";
import { VendorWarrantiesTab } from "@/components/vendors/tabs/vendor-warranties-tab";
import { VendorContractsTab } from "@/components/vendors/tabs/vendor-contracts-tab";
import { VendorServicesTab } from "@/components/vendors/tabs/vendor-services-tab";
import { formatSAR } from "@/lib/utils";
import {
  CountedTabs,
  type CountedTabConfig,
} from "@/components/ui/counted-tabs";

interface VendorDetailPageClientProps {
  vendor: VendorDTO;
  counts: VendorRelationCounts | null;
  statistics: VendorStatistics | null;
}

const VENDOR_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturer",
  RESELLER: "Reseller",
  SERVICE_PROVIDER: "Service Provider",
  CONSULTANT: "Consultant",
  CONTRACTOR: "Contractor",
  OTHER: "Other",
};

export function VendorDetailPageClient({
  vendor: initialVendor,
  counts,
  statistics,
}: VendorDetailPageClientProps) {
  const router = useRouter();
  const [vendor, setVendor] = useState(initialVendor);
  const { hasPermission } = usePermissions();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Permission checks
  const canUpdate = hasPermission(PERMISSIONS.VENDORS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.VENDORS_DELETE);
  const isCountsLoading = !counts;
  const tabCount = (value: number | undefined) =>
    isCountsLoading ? undefined : (value ?? 0);
  const productCount =
    (counts?.assetModels ?? 0) + (counts?.licenseProducts ?? 0);
  const servicesCount = (counts?.services ?? 0) + (counts?.disposals ?? 0);
  const tabs: CountedTabConfig[] = [
    {
      value: "overview",
      label: "Overview",
      content: <VendorOverviewTab vendor={vendor} />,
      showWhenZero: true,
    },
    {
      value: "contacts",
      label: "Contacts",
      count: tabCount(counts?.contacts),
      content: <VendorContactsTab vendorId={vendor.id} />,
    },
    {
      value: "products",
      label: "Products",
      count: tabCount(productCount),
      content: (
        <VendorProductsTab
          vendorId={vendor.id}
          assetModelsCount={counts?.assetModels ?? 0}
          licenseProductsCount={counts?.licenseProducts ?? 0}
        />
      ),
    },
    {
      value: "assets",
      label: "Assets",
      count: tabCount(counts?.assets),
      content: (
        <VendorAssetsTab
          vendorId={vendor.id}
          totalValue={statistics?.totalAssetValue ?? 0}
          assetCount={counts?.assets ?? 0}
        />
      ),
    },
    {
      value: "warranties",
      label: "Warranties",
      count: tabCount(counts?.warranties),
      content: (
        <VendorWarrantiesTab
          vendorId={vendor.id}
          activeCount={counts?.activeWarranties ?? 0}
          expiringSoonCount={statistics?.warrantiesExpiringSoon ?? 0}
        />
      ),
    },
    {
      value: "contracts",
      label: "Contracts",
      count: tabCount(counts?.contracts),
      content: (
        <VendorContractsTab
          vendorId={vendor.id}
          activeCount={counts?.activeContracts ?? 0}
        />
      ),
    },
    {
      value: "services",
      label: "Services",
      count: tabCount(servicesCount),
      content: (
        <VendorServicesTab
          vendorId={vendor.id}
          servicesCount={counts?.services ?? 0}
          disposalsCount={counts?.disposals ?? 0}
        />
      ),
    },
  ];

  const handleFormClose = useCallback(async () => {
    setIsFormOpen(false);
    // Fetch updated vendor data to refresh UI immediately
    const result = await getVendorAction(vendor.id);
    if (result.success) {
      setVendor(result.data);
    }
    router.refresh();
  }, [vendor.id, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteVendorAction(vendor.id);
      if (result.success) {
        toast.success(`${vendor.name} has been deleted`);
        router.push("/vendors");
      } else {
        toast.error(result.error ?? "Failed to delete vendor");
      }
    } catch {
      toast.error("Failed to delete vendor");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/vendors")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
              <Building2 className="text-primary h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {vendor.name}
              </h1>
              <p className="text-muted-foreground">
                {vendor.legalName ?? vendor.name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{vendor.code}</Badge>
                <Badge variant="secondary">
                  {VENDOR_TYPE_LABELS[vendor.vendorType] ?? vendor.vendorType}
                </Badge>
                {vendor.isPreferred && (
                  <Badge className="bg-amber-500 hover:bg-amber-600">
                    <Star className="mr-1 h-3 w-3" />
                    Preferred
                  </Badge>
                )}
                {vendor.isActive ? (
                  <Badge
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="mr-1 h-3 w-3" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {vendor.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${vendor.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </a>
            </Button>
          )}
          {vendor.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${vendor.phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call
              </a>
            </Button>
          )}
          {vendor.website && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="mr-2 h-4 w-4" />
                Website
              </a>
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Portfolio Value */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <DollarSign className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Portfolio Value</p>
              <p className="font-semibold">
                {formatSAR(statistics?.totalAssetValue ?? 0)}
              </p>
              <p className="text-muted-foreground text-xs">
                {statistics?.assetCount ?? 0} asset
                {(statistics?.assetCount ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contracts */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                (counts?.activeContracts ?? 0) > 0
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "bg-muted"
              }`}
            >
              <FileText
                className={`h-5 w-5 ${
                  (counts?.activeContracts ?? 0) > 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Contracts</p>
              <p className="font-semibold">
                {counts?.activeContracts ?? 0} active
              </p>
              <p className="text-muted-foreground text-xs">
                {counts?.contracts ?? 0} total
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Warranties */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                (statistics?.warrantiesExpiringSoon ?? 0) > 0
                  ? "bg-amber-100 dark:bg-amber-900"
                  : (counts?.activeWarranties ?? 0) > 0
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-muted"
              }`}
            >
              <Shield
                className={`h-5 w-5 ${
                  (statistics?.warrantiesExpiringSoon ?? 0) > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : (counts?.activeWarranties ?? 0) > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Warranties</p>
              <p className="font-semibold">
                {counts?.activeWarranties ?? 0} active
              </p>
              {(statistics?.warrantiesExpiringSoon ?? 0) > 0 && (
                <p className="text-xs text-amber-600">
                  {statistics?.warrantiesExpiringSoon} expiring soon
                </p>
              )}
              {(statistics?.warrantiesExpiringSoon ?? 0) === 0 && (
                <p className="text-muted-foreground text-xs">
                  {counts?.warranties ?? 0} total
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                (statistics?.productsCount ?? 0) > 0
                  ? "bg-purple-100 dark:bg-purple-900"
                  : "bg-muted"
              }`}
            >
              <Package
                className={`h-5 w-5 ${
                  (statistics?.productsCount ?? 0) > 0
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Products</p>
              <p className="font-semibold">
                {statistics?.productsCount ?? 0} product
                {(statistics?.productsCount ?? 0) !== 1 ? "s" : ""}
              </p>
              <p className="text-muted-foreground text-xs">
                {counts?.assetModels ?? 0} model
                {(counts?.assetModels ?? 0) !== 1 ? "s" : ""},{" "}
                {counts?.licenseProducts ?? 0} license
                {(counts?.licenseProducts ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CountedTabs
        defaultValue="overview"
        tabs={tabs}
        loading={isCountsLoading}
        tabsClassName="space-y-4"
      />

      {/* Edit Form Dialog */}
      <VendorForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormClose}
        vendor={vendor}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {vendor.name}. This action cannot be
              undone.
              {(counts?.assets ?? 0) > 0 && (
                <span className="mt-2 block text-amber-600">
                  Warning: This vendor has {counts?.assets} associated assets.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
