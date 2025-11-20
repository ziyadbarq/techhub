/**
 * Audit Logs Page Client Component
 *
 * Client-side orchestration for audit logs page.
 * Manages state, filtering, pagination, and data fetching.
 */

"use client";

import * as React from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  listAuditLogsAction,
  getAuditLogActionsAction,
  getAuditLogEntityTypesAction,
  exportAuditLogsAction,
} from "@/interface-adapters/controllers/audit-log.controller";
import type { PaginatedAuditLogsDTO } from "@/interface-adapters/presenters/audit-log.presenter";
import { AuditLogTable } from "./audit-log-table";
import {
  AuditLogFiltersComponent,
  type AuditLogFilters,
} from "./audit-log-filters";
import { Card } from "@/components/ui/card";

interface AuditLogsPageClientProps {
  initialData: PaginatedAuditLogsDTO;
}

export function AuditLogsPageClient({ initialData }: AuditLogsPageClientProps) {
  const [data, setData] = React.useState<PaginatedAuditLogsDTO>(initialData);
  const [loading, setLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [filters, setFilters] = React.useState<AuditLogFilters>({});
  const [actions, setActions] = React.useState<string[]>([]);
  const [entityTypes, setEntityTypes] = React.useState<string[]>([]);

  // Fetch filter options on mount
  React.useEffect(() => {
    const fetchFilterOptions = async () => {
      const [actionsResult, entityTypesResult] = await Promise.all([
        getAuditLogActionsAction(),
        getAuditLogEntityTypesAction(),
      ]);

      if (actionsResult.success) {
        setActions(actionsResult.data);
      }
      if (entityTypesResult.success) {
        setEntityTypes(entityTypesResult.data);
      }
    };

    fetchFilterOptions();
  }, []);

  const fetchData = React.useCallback(
    async (page: number, currentFilters: AuditLogFilters) => {
      setLoading(true);
      try {
        const result = await listAuditLogsAction({
          ...currentFilters,
          startDate: currentFilters.startDate
            ? new Date(currentFilters.startDate)
            : undefined,
          endDate: currentFilters.endDate
            ? new Date(currentFilters.endDate)
            : undefined,
          page,
          pageSize: data.pageSize,
        });

        if (result.success) {
          setData(result.data);
        } else {
          toast.error(result.error);
        }
      } catch (_error) {
        toast.error("Failed to fetch audit logs");
      } finally {
        setLoading(false);
      }
    },
    [data.pageSize],
  );

  const handlePageChange = (page: number) => {
    fetchData(page, filters);
  };

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    fetchData(1, newFilters);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportAuditLogsAction({
        ...filters,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        page: 1,
        pageSize: 10000, // Large pageSize to export all records
      });

      if (result.success && result.data) {
        // Convert to CSV
        const csvData = convertToCSV(result.data);

        // Create blob and download
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(
          `Exported ${result.data.length} audit log${result.data.length !== 1 ? "s" : ""}`,
        );
      } else {
        toast.error(
          !result.success ? result.error : "Failed to export audit logs",
        );
      }
    } catch (_error) {
      toast.error("Failed to export audit logs");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PermissionGuard
      permission={PERMISSIONS.AUDIT_LOGS_VIEW}
      fallback={
        <Card className="p-8">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              You do not have permission to view audit logs.
            </p>
          </div>
        </Card>
      }
    >
      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <h2 className="text-xl font-semibold">Activity Log</h2>
          <AuditLogFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            actions={actions}
            entityTypes={entityTypes}
          />
        </div>

        <AuditLogTable
          data={data.data}
          loading={loading}
          totalPages={data.totalPages}
          currentPage={data.page}
          pageSize={data.pageSize}
          onPageChange={handlePageChange}
          onExport={handleExport}
          isExporting={isExporting}
        />

        {/* Stats */}
        <div className="text-muted-foreground mt-4 text-sm">
          Showing {data.data.length} of {data.total} audit log
          {data.total !== 1 ? "s" : ""}
        </div>
      </Card>
    </PermissionGuard>
  );
}

/**
 * Convert audit logs to CSV format
 */
function convertToCSV(
  logs: Array<{
    id: string;
    userId?: string;
    userName?: string;
    action: string;
    entityType: string;
    entityId?: string;
    createdAt: string;
    ipAddress?: string;
    userAgent?: string;
  }>,
): string {
  const headers = [
    "ID",
    "Date",
    "User ID",
    "User Name",
    "Action",
    "Entity Type",
    "Entity ID",
    "IP Address",
    "User Agent",
  ];

  const rows = logs.map((log) => [
    log.id,
    format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
    log.userId || "",
    log.userName || "",
    log.action,
    log.entityType,
    log.entityId || "",
    log.ipAddress || "",
    log.userAgent || "",
  ]);

  // Escape CSV values
  const escape = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];

  return csvRows.join("\n");
}
