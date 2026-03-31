/**
 * Report Schedules Admin Page
 *
 * View and manage all scheduled report deliveries.
 * Admins can toggle active/inactive and delete schedules.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { listAllReportSchedulesAction } from "@/interface-adapters/controllers/reports/report.controller";
import { ReportSchedulesTable } from "@/components/reports/report-schedules-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Report Schedules",
  description: "Manage scheduled report email deliveries",
};

export default async function ReportSchedulesPage() {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_MANAGE);
  } catch (error) {
    handlePermissionRedirect(error, "/reports/schedules");
    throw error;
  }

  const result = await listAllReportSchedulesAction();
  const schedules = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Report Schedules
          </h1>
          <p className="text-muted-foreground">
            Manage automated report email deliveries across all users.
          </p>
        </div>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Schedules</CardTitle>
          <CardDescription>
            {schedules.length} schedule{schedules.length !== 1 ? "s" : ""}{" "}
            configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportSchedulesTable initialSchedules={schedules} />
        </CardContent>
      </Card>
    </div>
  );
}
