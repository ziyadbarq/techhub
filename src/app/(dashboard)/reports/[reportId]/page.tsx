/**
 * Report Viewer Page
 *
 * Dynamic page that renders any report from the catalog
 * with filters, data table, and export options.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled, requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import type { FeatureFlagKey } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { getReportDefinition } from "@/core/domain/reports/report-definitions";
import { ReportViewer } from "@/components/reports/report-viewer";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { reportId } = await params;
  const definition = getReportDefinition(reportId);
  return {
    title: definition?.name ?? "Report",
    description: definition?.description ?? "Report viewer",
  };
}

export default async function ReportViewerPage({ params }: PageProps) {
  try {
    await requireFeature(FEATURE_FLAGS.REPORTS);
    await requirePermission(PERMISSIONS.REPORTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/reports");
    throw error;
  }

  const { reportId } = await params;
  const definition = getReportDefinition(reportId);

  if (!definition) {
    notFound();
  }

  // Per-report feature flag check: e.g. CMDB reports need CMDB enabled
  for (const flag of definition.requiredFeatureFlags) {
    const enabled = await isFeatureEnabled(flag as FeatureFlagKey);
    if (!enabled) {
      notFound();
    }
  }

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
            {definition.name}
          </h1>
          <p className="text-muted-foreground">{definition.description}</p>
        </div>
      </div>

      {/* Report viewer with filters and table */}
      <ReportViewer definition={definition} />
    </div>
  );
}
