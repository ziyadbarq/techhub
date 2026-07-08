/**
 * CI Classes Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";
import { deleteCIClassAction } from "@/interface-adapters/controllers/ci-class.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface CIClassesTableProps {
  data: CIClassDTO[];
  onEdit: (ciClass: CIClassDTO) => void;
  onRefresh: () => void;
}

export function CIClassesTable({
  data,
  onEdit,
  onRefresh,
}: CIClassesTableProps) {
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<CIClassDTO>({
    onDelete: (ciClass) => deleteCIClassAction(ciClass.id),
    onSuccess: onRefresh,
    getItemName: (ciClass) => ciClass.name,
    entityName: "CI Class",
  });

  const columns = React.useMemo<ColumnDef<CIClassDTO>[]>(
    () => [
      buildSelectColumn<CIClassDTO>(),
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {row.getValue("code")}
          </Badge>
        ),
      },
      {
        accessorKey: "parentClassId",
        header: "Type",
        cell: ({ row }) => {
          const isRoot = !row.getValue("parentClassId");
          return (
            <Badge variant={isRoot ? "default" : "secondary"}>
              {isRoot ? "Root Class" : "Child Class"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "defaultCriticality",
        header: "Default Criticality",
        cell: ({ row }) => {
          const criticality = row.getValue("defaultCriticality") as
            string | null;
          if (!criticality)
            return <span className="text-muted-foreground">—</span>;

          const colors = {
            LOW: "bg-blue-100 text-blue-800",
            MEDIUM: "bg-yellow-100 text-yellow-800",
            HIGH: "bg-orange-100 text-orange-800",
            CRITICAL: "bg-red-100 text-red-800",
          };

          return (
            <Badge className={colors[criticality as keyof typeof colors]}>
              {criticality}
            </Badge>
          );
        },
      },
      {
        accessorKey: "defaultEnvironment",
        header: "Default Environment",
        cell: ({ row }) => {
          const env = row.getValue("defaultEnvironment") as string | null;
          if (!env) return <span className="text-muted-foreground">—</span>;

          const formatted = env.replace(/_/g, " ");
          return <span className="text-sm">{formatted}</span>;
        },
        meta: {
          label: "Default Environment",
          hiddenByDefault: true,
        },
      },
      {
        accessorKey: "isDiscoverable",
        header: "Discoverable",
        cell: ({ row }) => {
          const isDiscoverable = row.getValue("isDiscoverable") as boolean;
          return (
            <Badge variant={isDiscoverable ? "default" : "secondary"}>
              {isDiscoverable ? "Yes" : "No"}
            </Badge>
          );
        },
      },
      buildActionsColumn<CIClassDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.CI_CLASSES_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.CI_CLASSES_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    ],
    [onEdit, deleteDialog.openDialog],
  );

  // Column visibility with persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<CIClassDTO>({
      storageKey: "ci-classes-table-columns",
      columns,
    });

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        selectable
        searchable
        globalFilter
        searchPlaceholder="Search CI classes..."
        emptyMessage="No CI classes found."
        pagination={{ pageSize: 10 }}
        controlledState={{ columnVisibility: visibility }}
        onColumnVisibilityChange={onVisibilityChange}
      />
      <deleteDialog.DialogComponent />
    </>
  );
}
