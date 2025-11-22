/**
 * Maintenance Schedules Page
 * Lists all maintenance schedules with enriched asset and person data
 */

import Link from "next/link";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { listMaintenanceSchedulesAction } from "@/interface-adapters/controllers/maintenance-schedule.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
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
  getMaintenancePriorityLabel,
  getPriorityBadgeColor,
} from "@/core/domain/value-objects/maintenance-priority";
import { getScheduleDescription } from "@/core/domain/value-objects/schedule-type";

export const dynamic = "force-dynamic";

/**
 * Maintenance Schedules list page
 * Displays schedules with asset, schedule type, priority, and assignment information
 */
export default async function MaintenanceSchedulesPage() {
  await requirePermission(PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW);

  const result = await listMaintenanceSchedulesAction();
  const schedules = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Maintenance Schedules
        </h1>
        <p className="text-muted-foreground">
          View and manage recurring maintenance schedules for assets
        </p>
      </div>

      {/* Stats Summary */}
      {schedules.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Total Schedules
            </div>
            <div className="mt-2 text-2xl font-bold">{schedules.length}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Active
            </div>
            <div className="mt-2 text-2xl font-bold">
              {schedules.filter((s) => s.isActive).length}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              Overdue
            </div>
            <div className="mt-2 text-2xl font-bold">
              {schedules.filter((s) => s.isOverdue).length}
            </div>
          </div>
        </div>
      )}

      {/* Schedules Table */}
      <div className="bg-card rounded-lg border">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="text-muted-foreground/50 h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">
              No maintenance schedules found
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Create a maintenance schedule to track recurring maintenance tasks
              for your assets.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Assigned To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  {/* Title */}
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{schedule.title}</span>
                      {schedule.description && (
                        <span className="text-muted-foreground text-xs">
                          {schedule.description}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Asset Tag */}
                  <TableCell>
                    {schedule.assetTag ? (
                      <Link
                        href={`/assets/${schedule.assetTag}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {schedule.assetTag}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Schedule Type & Interval */}
                  <TableCell>
                    <span className="text-sm">
                      {getScheduleDescription(
                        schedule.scheduleType,
                        schedule.intervalValue,
                      )}
                    </span>
                  </TableCell>

                  {/* Next Due Date */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">
                        {new Date(schedule.nextDueDate).toLocaleDateString()}
                      </span>
                      {schedule.isOverdue && (
                        <Badge
                          variant="outline"
                          className="w-fit border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                        >
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getPriorityBadgeColor(schedule.priority)}
                    >
                      {getMaintenancePriorityLabel(schedule.priority)}
                    </Badge>
                  </TableCell>

                  {/* Is Active */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        schedule.isActive
                          ? "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
                          : "border-gray-500/20 bg-gray-500/10 text-gray-700 dark:text-gray-400"
                      }
                    >
                      {schedule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  {/* Assigned To */}
                  <TableCell>
                    {schedule.assignedToName ? (
                      <span className="text-sm">{schedule.assignedToName}</span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
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
