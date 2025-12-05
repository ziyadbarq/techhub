/**
 * Asset Assignments Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Star, Tag, User, Building2, MapPin, Server } from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { EntityDisplay } from "@/components/ui/entity-display";

import type { AssetAssignmentDTO } from "@/interface-adapters/presenters/asset-assignment.presenter";
import { deleteAssetAssignmentAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface AssetAssignmentsTableProps {
  data: AssetAssignmentDTO[];
  loading?: boolean;
  onEdit: (assetAssignment: AssetAssignmentDTO) => void;
  onRefresh: () => void;
}

export function AssetAssignmentsTable({
  data,
  loading = false,
  onEdit,
  onRefresh,
}: AssetAssignmentsTableProps) {
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<AssetAssignmentDTO>({
    onDelete: (assignment) => deleteAssetAssignmentAction(assignment.id),
    onSuccess: onRefresh,
    getItemName: (assignment) =>
      `${assignment.assetTag} → ${assignment.assigneeName}`,
    entityName: "Asset Assignment",
  });

  const columns: ColumnDef<AssetAssignmentDTO>[] = [
    buildSelectColumn<AssetAssignmentDTO>(),
    {
      accessorKey: "assetTag",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Asset" />
      ),
      cell: ({ row }) => {
        const isPrimary = row.original.isPrimary;
        return (
          <div className="flex items-center gap-2">
            <EntityDisplay name={row.original.assetTag} icon={Tag} />
            {isPrimary && (
              <Star className="fill-barq-yellow text-barq-yellow h-3 w-3" />
            )}
          </div>
        );
      },
      meta: {
        label: "Asset",
      },
    },
    {
      accessorKey: "assigneeType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assignee Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("assigneeType") as string;
        return (
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        );
      },
      meta: {
        label: "Assignee Type",
      },
    },
    {
      accessorKey: "assigneeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assignee" />
      ),
      cell: ({ row }) => {
        const assigneeType = row.original.assigneeType;
        const icon =
          assigneeType === "PERSON"
            ? User
            : assigneeType === "ORG_UNIT"
              ? Building2
              : assigneeType === "LOCATION"
                ? MapPin
                : Server;
        return <EntityDisplay name={row.original.assigneeName} icon={icon} />;
      },
      meta: {
        label: "Assignee",
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        const startDate = row.getValue("startDate") as string;
        return (
          <span className="text-sm">
            {format(new Date(startDate), "MMM d, yyyy")}
          </span>
        );
      },
      meta: {
        label: "Start Date",
      },
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => {
        const endDate = row.getValue("endDate") as string | null;
        return (
          <span className="text-muted-foreground text-sm">
            {endDate ? format(new Date(endDate), "MMM d, yyyy") : "—"}
          </span>
        );
      },
      meta: {
        label: "End Date",
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
      meta: {
        label: "Status",
      },
    },
    {
      accessorKey: "durationInDays",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => {
        const days = row.getValue("durationInDays") as number;
        return (
          <span className="text-muted-foreground text-sm">
            {days > 0 ? `${days}d` : "—"}
          </span>
        );
      },
      meta: {
        label: "Duration",
      },
    },
    buildActionsColumn<AssetAssignmentDTO>([
      {
        type: "edit",
        label: "Edit",
        permission: PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE,
        onClick: onEdit,
      },
      {
        type: "delete",
        label: "Delete",
        permission: PERMISSIONS.ASSET_ASSIGNMENTS_DELETE,
        variant: "destructive",
        separator: true,
        onClick: deleteDialog.openDialog,
      },
    ]),
  ];

  return (
    <>
      <DataTable columns={columns} data={data} loading={loading} />
      <deleteDialog.DialogComponent />
    </>
  );
}
