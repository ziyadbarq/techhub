/**
 * Services Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

import type { ServiceDTO } from "@/interface-adapters/presenters/service.presenter";
import { deleteServiceAction } from "@/interface-adapters/controllers/service.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildActionsColumn } from "@/lib/table-utils";
import type { ServiceType } from "@/generated/prisma/enums";
import { ServiceStatus, CriticalityLevel } from "@/generated/prisma/enums";

interface ServicesTableProps {
  data: ServiceDTO[];
  loading?: boolean;
  onRefresh: () => void;
}

export function ServicesTable({
  data,
  loading = false,
  onRefresh,
}: ServicesTableProps) {
  const router = useRouter();

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<ServiceDTO>({
    onDelete: (service) => deleteServiceAction(service.id),
    onSuccess: onRefresh,
    getItemName: (service) => service.name,
    entityName: "Service",
  });

  const getStatusBadgeVariant = (
    status: ServiceStatus,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case ServiceStatus.PRODUCTION:
        return "default";
      case ServiceStatus.RETIRED:
        return "secondary";
      case ServiceStatus.UAT:
        return "outline";
      case ServiceStatus.DEVELOPMENT:
        return "outline";
      case ServiceStatus.DR:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getCriticalityBadgeVariant = (
    criticality: CriticalityLevel,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (criticality) {
      case CriticalityLevel.CRITICAL:
        return "destructive";
      case CriticalityLevel.HIGH:
        return "default";
      case CriticalityLevel.MEDIUM:
        return "outline";
      case CriticalityLevel.LOW:
        return "secondary";
      default:
        return "secondary";
    }
  };

  const baseColumns = React.useMemo<ColumnDef<ServiceDTO>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Service Name" />
        ),
        cell: ({ row }) => {
          const service = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                href={`/services/${service.id}`}
                className="text-primary font-medium hover:underline"
              >
                {service.name}
              </Link>
              {service.isEssentialService && (
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              )}
            </div>
          );
        },
        meta: {
          label: "Service Name",
        },
      },
      {
        accessorKey: "serviceType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const type = row.getValue("serviceType") as ServiceType;
          return (
            <span className="text-sm">
              {type.replace(/_/g, " ").toLowerCase()}
            </span>
          );
        },
        meta: {
          label: "Type",
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "currentStatus",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("currentStatus") as ServiceStatus;
          return (
            <Badge variant={getStatusBadgeVariant(status)}>
              {status.replace(/_/g, " ")}
            </Badge>
          );
        },
        meta: {
          label: "Status",
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "criticality",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Criticality" />
        ),
        cell: ({ row }) => {
          const criticality = row.getValue("criticality") as CriticalityLevel;
          return (
            <Badge variant={getCriticalityBadgeVariant(criticality)}>
              {criticality}
            </Badge>
          );
        },
        meta: {
          label: "Criticality",
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "businessImpactLevel",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Business Impact" />
        ),
        cell: ({ row }) => {
          const impact = row.getValue("businessImpactLevel") as string;
          return <span className="text-sm">{impact}</span>;
        },
        meta: {
          label: "Business Impact",
        },
      },
      {
        accessorKey: "vendorName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Vendor" />
        ),
        cell: ({ row }) => {
          const vendorName = row.original.vendorName;
          return (
            <span className="text-sm">
              {vendorName || <span className="text-muted-foreground">—</span>}
            </span>
          );
        },
        meta: {
          label: "Vendor",
        },
      },
      {
        accessorKey: "deploymentDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Deployed" />
        ),
        cell: ({ row }) => {
          const deploymentDate = row.getValue("deploymentDate") as
            | string
            | null;
          if (!deploymentDate) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return (
            <span className="text-sm">
              {format(new Date(deploymentDate), "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Deployed",
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<ServiceDTO>([
        {
          type: "view",
          label: "View Details",
          permission: PERMISSIONS.SERVICES_VIEW,
          onClick: (service) => router.push(`/services/${service.id}`),
        },
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.SERVICES_UPDATE,
          onClick: (service) => router.push(`/services/${service.id}/edit`),
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.SERVICES_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [router, deleteDialog.openDialog],
  );

  // Merge static columns + actions column
  const allColumns = React.useMemo(() => {
    return [...baseColumns, actionsColumn];
  }, [baseColumns, actionsColumn]);

  return (
    <>
      <DataTable
        columns={allColumns}
        data={data}
        loading={loading}
        initialColumnVisibility={{
          businessImpactLevel: false,
          deploymentDate: false,
        }}
      />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
