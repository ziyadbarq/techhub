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
import { AssetsWithoutWarrantyReport } from "@/components/reports/assets-without-warranty-report";
import { UnassignedAssetsReport } from "@/components/reports/unassigned-assets-report";
import { AssetsByDepartmentReport } from "@/components/reports/assets-by-department-report";
import { AssetValueByCategoryReport } from "@/components/reports/asset-value-by-category-report";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Asset Reports",
  description: "Standard asset management reports and analytics",
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
  await requirePermission(PERMISSIONS.DASHBOARD_ANALYTICS);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asset Reports</h1>
        <p className="text-muted-foreground">
          Standard reports for asset management and analytics
        </p>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="eol" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="eol">End of Life</TabsTrigger>
          <TabsTrigger value="warranty">Warranty</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          <TabsTrigger value="department">By Department</TabsTrigger>
          <TabsTrigger value="value">Value by Category</TabsTrigger>
        </TabsList>

        <TabsContent value="eol" className="mt-6">
          <Suspense fallback={<ReportSkeleton />}>
            <AssetsNearingEOLReport />
          </Suspense>
        </TabsContent>

        <TabsContent value="warranty" className="mt-6">
          <Suspense fallback={<ReportSkeleton />}>
            <AssetsWithoutWarrantyReport />
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
            <CardTitle className="text-base">Warranty Report</CardTitle>
            <CardDescription>
              Assets without warranty coverage or with expired warranties
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
      </div>
    </div>
  );
}
