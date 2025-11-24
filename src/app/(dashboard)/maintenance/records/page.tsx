/**
 * Maintenance Records Page
 * Lists all maintenance records with enriched asset and person data
 */

import Link from "next/link";
import { ClipboardList, Calendar, DollarSign } from "lucide-react";
import { listMaintenanceRecordsAction } from "@/interface-adapters/controllers/maintenance-record.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getMaintenanceStatusLabel,
  getStatusBadgeColor,
} from "@/core/domain/value-objects/maintenance-status";

export const dynamic = "force-dynamic";

/**
 * Format currency for display
 */
function formatCurrency(amount: number | null): string {
  if (amount === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Maintenance Records list page
 * Displays records with asset, status, dates, and cost information
 */
export default async function MaintenanceRecordsPage() {
  try {
    await requirePermission(PERMISSIONS.MAINTENANCE_RECORDS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/maintenance/records");
    throw error;
  }

  const result = await listMaintenanceRecordsAction();
  const records = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Maintenance Records
        </h1>
        <p className="text-muted-foreground">
          View and track maintenance activities and their completion status
        </p>
      </div>

      {/* Stats Summary */}
      {records.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4" />
              Total Records
            </div>
            <div className="mt-2 text-2xl font-bold">{records.length}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Completed
            </div>
            <div className="mt-2 text-2xl font-bold">
              {records.filter((r) => r.isComplete).length}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              In Progress
            </div>
            <div className="mt-2 text-2xl font-bold">
              {records.filter((r) => r.status === "IN_PROGRESS").length}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </div>
            <div className="mt-2 text-2xl font-bold">
              {formatCurrency(
                records.reduce((sum, r) => sum + (r.cost || 0), 0),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-card rounded-lg border">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="text-muted-foreground/50 h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">
              No maintenance records found
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Create a maintenance record to track maintenance activities for
              your assets.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Completed Date</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  {/* Title */}
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{record.title}</span>
                      {record.description && (
                        <span className="text-muted-foreground text-xs">
                          {record.description}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Asset Tag */}
                  <TableCell>
                    {record.assetTag ? (
                      <Link
                        href={`/assets/${record.assetTag}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {record.assetTag}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusBadgeColor(record.status)}
                    >
                      {getMaintenanceStatusLabel(record.status)}
                    </Badge>
                  </TableCell>

                  {/* Scheduled Date */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">
                        {new Date(record.scheduledDate).toLocaleDateString()}
                      </span>
                      {record.isOverdue && !record.isComplete && (
                        <Badge
                          variant="outline"
                          className="w-fit border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                        >
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Completed Date */}
                  <TableCell>
                    {record.completedDate ? (
                      <span className="text-sm">
                        {new Date(record.completedDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Performed By */}
                  <TableCell>
                    {record.performedByName ? (
                      <span className="text-sm">{record.performedByName}</span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>

                  {/* Cost */}
                  <TableCell className="text-right">
                    <span className="text-sm font-medium">
                      {formatCurrency(record.cost)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
