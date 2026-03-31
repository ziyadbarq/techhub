/**
 * Reports Hub Page
 *
 * Displays a catalog of available reports grouped by category.
 * Reports are filtered based on enabled feature flags.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireFeature } from "@/lib/features/server";
import { requirePermission, hasPermission } from "@/lib/permissions/server";
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

export default async function ReportsPage() {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/reports");
    throw error;
  }

  const canManageSchedules = await hasPermission(PERMISSIONS.REPORTS_MANAGE);

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
        {canManageSchedules && (
          <Button variant="outline" asChild>
            <Link href="/reports/schedules">
              <Clock className="mr-2 h-4 w-4" />
              Manage Schedules
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<CatalogSkeleton />}>
        <ReportCatalog />
      </Suspense>
    </div>
  );
}
