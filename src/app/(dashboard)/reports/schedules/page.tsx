/**
 * Report Schedules Page
 *
 * - REPORTS_MANAGE users see all schedules across all users
 * - REPORTS_SCHEDULE users see only their own schedules
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
import {
  hasAny,
  hasPermission,
  requirePermission,
} from "@/lib/permissions/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import {
  listAllReportSchedulesAction,
  listMyReportSchedulesAction,
} from "@/interface-adapters/controllers/reports/report.controller";
import { ReportSchedulesTable } from "@/components/reports/report-schedules-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Report Schedules",
  description: "Manage scheduled report email deliveries",
};

export default async function ReportSchedulesPage() {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    const canAccess = await hasAny([
      PERMISSIONS.REPORTS_SCHEDULE,
      PERMISSIONS.REPORTS_MANAGE,
    ]);
    if (!canAccess) {
      await requirePermission(PERMISSIONS.REPORTS_SCHEDULE);
    }
  } catch (error) {
    handlePermissionRedirect(error, "/reports/schedules");
    throw error;
  }

  const isAdmin = await hasPermission(PERMISSIONS.REPORTS_MANAGE);

  const result = isAdmin
    ? await listAllReportSchedulesAction()
    : await listMyReportSchedulesAction();
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
            {isAdmin
              ? "Manage automated report email deliveries across all users."
              : "Manage your scheduled report email deliveries."}
          </p>
        </div>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? "All Schedules" : "My Schedules"}</CardTitle>
          <CardDescription>
            {schedules.length} schedule{schedules.length !== 1 ? "s" : ""}{" "}
            configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportSchedulesTable
            initialSchedules={schedules}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
