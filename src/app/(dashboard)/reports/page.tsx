/**
 * Reports Hub Page
 *
 * Displays a catalog of available reports grouped by category.
 * Reports are filtered based on enabled feature flags.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LicenseComplianceReport } from "@/components/reports/license-compliance-report";
import { ContractExpirationReport } from "@/components/reports/contract-expiration-report";
import { OciResourceInventoryReport } from "@/components/reports/oci-resource-inventory-report";
import { isFeatureEnabled, requireFeature } from "@/lib/features/server";
import { hasAny, requirePermission } from "@/lib/permissions/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { ReportCatalog } from "@/components/reports/report-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports",
  description: "Reports & analytics with PDF export and scheduled delivery",
};

function CatalogSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  );
}

type SnapshotTab = {
  value: string;
  label: string;
  content: ReactElement;
};

export default async function ReportsPage() {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/reports");
    throw error;
  }

  const canSchedule = await hasAny([
    PERMISSIONS.REPORTS_SCHEDULE,
    PERMISSIONS.REPORTS_MANAGE,
  ]);
  const [licensesEnabled, contractsEnabled, ociSyncEnabled] = await Promise.all(
    [
      isFeatureEnabled(FEATURE_FLAGS.LICENSES),
      isFeatureEnabled(FEATURE_FLAGS.CONTRACTS),
      isFeatureEnabled(FEATURE_FLAGS.OCI_SYNC),
    ],
  );
  const snapshotTabs: SnapshotTab[] = [];
  if (licensesEnabled) {
    snapshotTabs.push({
      value: "licenses",
      label: "License Compliance",
      content: <LicenseComplianceReport />,
    });
  }
  if (contractsEnabled) {
    snapshotTabs.push({
      value: "contracts",
      label: "Contract Expiration",
      content: <ContractExpirationReport />,
    });
  }
  if (ociSyncEnabled) {
    snapshotTabs.push({
      value: "oci",
      label: "OCI Inventory",
      content: <OciResourceInventoryReport />,
    });
  }
  const tabsListClassName =
    snapshotTabs.length === 1
      ? "grid w-full grid-cols-1 gap-2"
      : snapshotTabs.length === 2
        ? "grid w-full grid-cols-1 gap-2 sm:grid-cols-2"
        : "grid w-full grid-cols-1 gap-2 sm:grid-cols-3";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Run pre-defined reports, export to PDF/CSV/Excel, and schedule
            automated email delivery.
          </p>
        </div>
        {canSchedule && (
          <Button variant="outline" asChild>
            <Link href="/reports/schedules">
              <Clock className="mr-2 h-4 w-4" />
              My Schedules
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<CatalogSkeleton />}>
        <ReportCatalog />
      </Suspense>

      {snapshotTabs.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Operational Snapshots
            </h2>
            <p className="text-muted-foreground">
              Focused compliance and infrastructure views for quick operational
              status checks.
            </p>
          </div>

          <Tabs defaultValue={snapshotTabs[0].value} className="w-full">
            <TabsList className={tabsListClassName}>
              {snapshotTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {snapshotTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      )}
    </div>
  );
}
