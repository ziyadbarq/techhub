/**
 * CI Relationships Table Component
 */

"use client";
"use no memo";

import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "lucide-react";
import { formatDate } from "@/lib/utils/date-format";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type { CIRelationshipDTO } from "@/interface-adapters/dtos/generated/ci-relationship.dto";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { deleteCIRelationshipAction } from "@/interface-adapters/controllers/ci-relationship.controller";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildActionsColumn } from "@/lib/table-utils";

interface CIRelationshipsTableProps {
  data: CIRelationshipDTO[];
  loading?: boolean;
  onView: (relationship: CIRelationshipDTO) => void;
  onEdit: (relationship: CIRelationshipDTO) => void;
  onRefresh: () => void;
}

export function CIRelationshipsTable({
  data,
  loading,
  onView,
  onEdit,
  onRefresh,
}: CIRelationshipsTableProps) {
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<CIRelationshipDTO>({
    onDelete: (relationship) => deleteCIRelationshipAction(relationship.id),
    onSuccess: onRefresh,
    getItemName: (relationship) =>
      `${relationship.fromCiName} → ${relationship.toCiName}`,
    entityName: "Relationship",
  });

  const columns: ColumnDef<CIRelationshipDTO>[] = [
    {
      accessorKey: "fromCiName",
      header: "From CI",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.fromCiName || "—"}</div>
      ),
    },
    {
      accessorKey: "relationshipTypeName",
      header: "Relationship",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link className="text-muted-foreground h-4 w-4" />
          <span>{row.original.relationshipTypeName || "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "toCiName",
      header: "To CI",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.toCiName || "—"}</div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge
            variant="outline"
            className={
              isActive
                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "validFrom",
      header: "Valid From",
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.original.validFrom)}</div>
      ),
    },
    {
      accessorKey: "validTo",
      header: "Valid To",
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.original.validTo) || "—"}</div>
      ),
      meta: {
        label: "Valid To",
        hiddenByDefault: true,
      },
    },
    buildActionsColumn<CIRelationshipDTO>([
      {
        type: "view",
        label: "View",
        onClick: onView,
      },
      {
        type: "edit",
        label: "Edit",
        permission: PERMISSIONS.CI_RELATIONSHIPS_UPDATE,
        onClick: onEdit,
      },
      {
        type: "delete",
        label: "Delete",
        permission: PERMISSIONS.CI_RELATIONSHIPS_DELETE,
        variant: "destructive",
        separator: true,
        onClick: deleteDialog.openDialog,
      },
    ]),
  ];

  // Column visibility with persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<CIRelationshipDTO>({
      storageKey: "ci-relationships-table-columns",
      columns,
    });

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchable
        globalFilter
        searchPlaceholder="Search relationships..."
        emptyMessage="No relationships found"
        controlledState={{ columnVisibility: visibility }}
        onColumnVisibilityChange={onVisibilityChange}
      />
      <deleteDialog.DialogComponent />
    </>
  );
}
