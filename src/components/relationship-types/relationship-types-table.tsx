/**
 * Relationship Types Table Component
 */

"use client";
"use no memo";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowRightLeft, ArrowRight, Check, X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import type { RelationshipTypeDTO } from "@/interface-adapters/dtos/generated/relationship-type.dto";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { deleteRelationshipTypeAction } from "@/interface-adapters/controllers/relationship-type.controller";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildActionsColumn } from "@/lib/table-utils";

interface RelationshipTypesTableProps {
  data: RelationshipTypeDTO[];
  loading?: boolean;
  onView: (type: RelationshipTypeDTO) => void;
  onEdit: (type: RelationshipTypeDTO) => void;
  onRefresh: () => void;
}

export function RelationshipTypesTable({
  data,
  loading,
  onView,
  onEdit,
  onRefresh,
}: RelationshipTypesTableProps) {
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<RelationshipTypeDTO>({
    onDelete: (type) => deleteRelationshipTypeAction(type.id),
    onSuccess: onRefresh,
    getItemName: (type) => type.name,
    entityName: "Relationship Type",
    description:
      "This action cannot be undone and may affect existing relationships.",
  });

  const columns: ColumnDef<RelationshipTypeDTO>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue<string>("name")}</div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono text-xs uppercase">
          {row.getValue<string>("code")}
        </div>
      ),
    },
    {
      accessorKey: "direction",
      header: "Direction",
      cell: ({ row }) => {
        const direction = row.getValue<string>("direction");
        return (
          <div className="flex items-center gap-2">
            {direction === "BIDIRECTIONAL" ? (
              <>
                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Bidirectional</span>
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Unidirectional</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isImpacting",
      header: "Impacting",
      cell: ({ row }) => {
        const isImpacting = row.getValue<boolean>("isImpacting");
        return isImpacting ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-gray-400" />
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="text-muted-foreground max-w-md truncate text-sm">
          {row.original.description || "—"}
        </div>
      ),
      meta: {
        label: "Description",
        hiddenByDefault: true,
      },
    },
    buildActionsColumn<RelationshipTypeDTO>([
      {
        type: "view",
        label: "View",
        onClick: onView,
      },
      {
        type: "edit",
        label: "Edit",
        permission: PERMISSIONS.RELATIONSHIP_TYPES_UPDATE,
        onClick: onEdit,
      },
      {
        type: "delete",
        label: "Delete",
        permission: PERMISSIONS.RELATIONSHIP_TYPES_DELETE,
        variant: "destructive",
        separator: true,
        onClick: deleteDialog.openDialog,
      },
    ]),
  ];

  // Column visibility with persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<RelationshipTypeDTO>({
      storageKey: "relationship-types-table-columns",
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
        searchPlaceholder="Search by name or code..."
        emptyMessage="No relationship types found"
        controlledState={{ columnVisibility: visibility }}
        onColumnVisibilityChange={onVisibilityChange}
      />
      <deleteDialog.DialogComponent />
    </>
  );
}
