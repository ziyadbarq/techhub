/**
 * Audit Logs Page
 *
 * Admin page for viewing and filtering audit logs.
 * Features:
 * - Permission-based access control
 * - TanStack Table with sorting and pagination
 * - Advanced filtering (user, action, entity type, date range)
 * - Expandable rows with JSON diff viewer
 * - CSV export
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditLogsPageClient } from "@/components/audit/audit-logs-page-client";
import { listAuditLogsAction } from "@/interface-adapters/controllers/audit-log.controller";
import { requirePermission } from "@/lib/permissions/server";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  // Security: Require permission to view audit logs
  try {
    await requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/admin/audit-logs");
    throw error;
  }

  // Fetch initial data on the server
  const result = await listAuditLogsAction({ page: 1, pageSize: 10 });
  const initialData = result.success
    ? result.data
    : { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/" className="mb-6 inline-block">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground text-lg">
            View and analyze system activity with advanced filtering and search
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-muted/50 mb-8 rounded-lg border p-6">
          <h2 className="mb-3 text-lg font-semibold">
            System Activity Tracking
          </h2>
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-medium">Features</h3>
              <ul className="text-muted-foreground space-y-1">
                <li>✓ Real-time activity monitoring</li>
                <li>✓ User action tracking</li>
                <li>✓ Entity change history</li>
                <li>✓ Expandable details with JSON diff</li>
                <li>✓ CSV export for compliance</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Filtering Options</h3>
              <ul className="text-muted-foreground space-y-1">
                <li>✓ Filter by user</li>
                <li>✓ Filter by action type</li>
                <li>✓ Filter by entity type</li>
                <li>✓ Date range selection</li>
                <li>✓ Full-text search</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Architecture</h3>
              <ul className="text-muted-foreground space-y-1">
                <li>✓ Clean Architecture pattern</li>
                <li>✓ Repository pattern</li>
                <li>✓ Use case orchestration</li>
                <li>✓ Dependency injection</li>
                <li>✓ RBAC permission guard</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <AuditLogsPageClient initialData={initialData} />

        {/* Footer */}
        <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
          <p>Explore the audit log implementation:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <code className="bg-muted rounded px-2 py-1">
              src/core/repositories/audit-log-repository.interface.ts
            </code>
            <code className="bg-muted rounded px-2 py-1">
              src/core/use-cases/audit-log/
            </code>
            <code className="bg-muted rounded px-2 py-1">
              src/components/audit/
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
