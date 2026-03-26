/**
 * Reports Hub Page
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetsNearingEOLReport } from "@/components/reports/assets-nearing-eol-report";
import { UnassignedAssetsReport } from "@/components/reports/unassigned-assets-report";
import { AssetsByDepartmentReport } from "@/components/reports/assets-by-department-report";
import { AssetValueByCategoryReport } from "@/components/reports/asset-value-by-category-report";
import { LicenseComplianceReport } from "@/components/reports/license-compliance-report";
import { ContractExpirationReport } from "@/components/reports/contract-expiration-report";
import { OciResourceInventoryReport } from "@/components/reports/oci-resource-inventory-report";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports",
  description: "Asset management, compliance, and infrastructure reports",
};

function ReportSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="bg-muted h-6 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="bg-muted h-64 animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

export default async function ReportsPage() {
  // Server-side permission check
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_ANALYTICS);
  } catch (error) {
    handlePermissionRedirect(error, "/reports");
    throw error;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Asset management, compliance, and infrastructure reports
        </p>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="eol" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="eol">End of Life</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          <TabsTrigger value="department">By Department</TabsTrigger>
          <TabsTrigger value="value">Value by Category</TabsTrigger>
          <TabsTrigger value="licenses">License Compliance</TabsTrigger>
          <TabsTrigger value="contracts">Contract Expiration</TabsTrigger>
          <TabsTrigger value="oci">OCI Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="eol" className="mt-6">
          <Suspense fallback={<ReportSkeleton />}>
            <AssetsNearingEOLReport />
          </Suspense>
        </TabsContent>

        <TabsContent value="unassigned" className="mt-6">
          <Suspense fallback={<ReportSkeleton />}>
            <UnassignedAssetsReport />
          </Suspense>
        </TabsContent>

        <TabsContent value="department" className="mt-6">
          <Suspense fallback={<ReportSkeleton />}>
            <AssetsByDepartmentReport />
          </Suspense>
        </TabsContent>

        <TabsContent value="value" className="mt-6">
          <Suspense fallback={<ReportSkeleton />}>
            <AssetValueByCategoryReport />
          </Suspense>
        </TabsContent>

        <TabsContent value="licenses" className="mt-6">
          <Suspense fallback={<ReportSkeleton />}>
            <LicenseComplianceReport />
          </Suspense>
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <Suspense fallback={<ReportSkeleton />}>
            <ContractExpirationReport />
          </Suspense>
        </TabsContent>

        <TabsContent value="oci" className="mt-6">
          <Suspense fallback={<ReportSkeleton />}>
            <OciResourceInventoryReport />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Report Descriptions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">End of Life Report</CardTitle>
            <CardDescription>
              Assets nearing depreciation completion or already fully
              depreciated
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unassigned Assets</CardTitle>
            <CardDescription>
              Assets in stock not currently assigned to any person or department
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Report</CardTitle>
            <CardDescription>
              Asset distribution and total value by department or organizational
              unit
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Value by Category Report
            </CardTitle>
            <CardDescription>
              Total and average asset value breakdown by category with
              percentage distribution
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">License Compliance</CardTitle>
            <CardDescription>
              License utilization tracking — purchased vs allocated quantities,
              expiring entitlements, and over/under-allocation
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contract Expiration</CardTitle>
            <CardDescription>
              Contract renewal timeline with 30/60/90-day warnings, value at
              risk, and auto-renewal status
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">OCI Resource Inventory</CardTitle>
            <CardDescription>
              Oracle Cloud Infrastructure resources by type, region, and
              lifecycle state from automated sync
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
