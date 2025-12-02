"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

import type { DataOwnershipDTO } from "@/interface-adapters/presenters/data-ownership.presenter";
import type { DataDomainDTO } from "@/interface-adapters/presenters/data-domain.presenter";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import { deleteDataOwnership } from "@/interface-adapters/controllers/data-ownership.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface DataOwnershipsTableProps {
  data: DataOwnershipDTO[];
  dataDomains: DataDomainDTO[];
  ciClasses: CIClassDTO[];
  assetCategories: AssetCategoryDTO[];
  persons: PersonDTO[];
  organizationUnits: OrganizationUnitDTO[];
  loading?: boolean;
  onEdit: (dataOwnership: DataOwnershipDTO) => void;
  onRefresh: () => void;
}

export function DataOwnershipsTable({
  data,
  dataDomains,
  ciClasses,
  assetCategories,
  persons,
  organizationUnits,
  loading = false,
  onEdit,
  onRefresh,
}: DataOwnershipsTableProps) {
  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<DataOwnershipDTO>({
    onDelete: (ownership) => deleteDataOwnership(ownership.id),
    onSuccess: onRefresh,
    getItemName: (ownership) => {
      const domain = dataDomains.find((d) => d.id === ownership.dataDomainId);
      return domain?.name || "Data Ownership";
    },
    entityName: "Data Ownership",
  });

  // Helper functions to get names from IDs
  const getDataDomainName = React.useCallback(
    (id: string): string => {
      const domain = dataDomains.find((d) => d.id === id);
      return domain?.name || "Unknown Domain";
    },
    [dataDomains],
  );

  const getCIClassName = React.useCallback(
    (id: string | null): string | null => {
      if (!id) return null;
      const ciClass = ciClasses.find((c) => c.id === id);
      return ciClass?.name || "Unknown CI Class";
    },
    [ciClasses],
  );

  const getAssetCategoryName = React.useCallback(
    (id: string | null): string | null => {
      if (!id) return null;
      const category = assetCategories.find((c) => c.id === id);
      return category?.name || "Unknown Asset Category";
    },
    [assetCategories],
  );

  const getPersonName = React.useCallback(
    (id: string | null): string | null => {
      if (!id) return null;
      const person = persons.find((p) => p.id === id);
      return person
        ? `${person.firstName} ${person.lastName}`
        : "Unknown Person";
    },
    [persons],
  );

  const getOrgUnitName = React.useCallback(
    (id: string | null): string | null => {
      if (!id) return null;
      const orgUnit = organizationUnits.find((o) => o.id === id);
      return orgUnit?.name || "Unknown Org Unit";
    },
    [organizationUnits],
  );

  const getTargetDisplay = React.useCallback(
    (ownership: DataOwnershipDTO): string => {
      if (ownership.ciClassId) {
        const name = getCIClassName(ownership.ciClassId);
        return `CI Class: ${name}`;
      } else if (ownership.assetCategoryId) {
        const name = getAssetCategoryName(ownership.assetCategoryId);
        return `Asset Category: ${name}`;
      }
      return "No Target";
    },
    [getCIClassName, getAssetCategoryName],
  );

  const getOwnerDisplay = React.useCallback(
    (ownership: DataOwnershipDTO): string => {
      if (ownership.ownerPersonId) {
        const name = getPersonName(ownership.ownerPersonId);
        return `Person: ${name}`;
      } else if (ownership.ownerOrgUnitId) {
        const name = getOrgUnitName(ownership.ownerOrgUnitId);
        return `Org Unit: ${name}`;
      }
      return "No Owner";
    },
    [getPersonName, getOrgUnitName],
  );

  const baseColumns = React.useMemo<ColumnDef<DataOwnershipDTO>[]>(
    () => [
      buildSelectColumn<DataOwnershipDTO>(),
      {
        accessorKey: "dataDomainId",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Data Domain" />
        ),
        cell: ({ row }) => {
          const domainId = row.getValue("dataDomainId") as string;
          const domainName = getDataDomainName(domainId);
          return <span className="font-medium">{domainName}</span>;
        },
        meta: {
          label: "Data Domain",
        },
      },
      {
        id: "target",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Target" />
        ),
        cell: ({ row }) => {
          const ownership = row.original;
          const targetDisplay = getTargetDisplay(ownership);
          return <span className="text-sm">{targetDisplay}</span>;
        },
        meta: {
          label: "Target",
        },
      },
      {
        id: "owner",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Owner" />
        ),
        cell: ({ row }) => {
          const ownership = row.original;
          const ownerDisplay = getOwnerDisplay(ownership);
          return (
            <span
              className={`text-sm ${ownership.ownerPersonId || ownership.ownerOrgUnitId ? "" : "text-muted-foreground"}`}
            >
              {ownerDisplay}
            </span>
          );
        },
        meta: {
          label: "Owner",
        },
      },
      {
        accessorKey: "note",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Note" />
        ),
        cell: ({ row }) => {
          const note = row.getValue("note") as string | null;
          if (!note) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          const truncated =
            note.length > 50 ? `${note.substring(0, 50)}...` : note;
          return <span className="text-sm">{truncated}</span>;
        },
        meta: {
          label: "Note",
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as Date;
          return (
            <span className="text-muted-foreground text-sm">
              {format(new Date(date), "MMM d, yyyy")}
            </span>
          );
        },
        meta: {
          label: "Created",
        },
      },
    ],
    [getDataDomainName, getOwnerDisplay, getTargetDisplay],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<DataOwnershipDTO>([
        {
          type: "edit",
          label: "Edit",
          permission: PERMISSIONS.DATA_OWNERSHIPS_UPDATE,
          onClick: onEdit,
        },
        {
          type: "delete",
          label: "Delete",
          permission: PERMISSIONS.DATA_OWNERSHIPS_DELETE,
          variant: "destructive",
          separator: true,
          onClick: deleteDialog.openDialog,
        },
      ]),
    [onEdit, deleteDialog.openDialog],
  );

  // Merge static columns + actions column
  const columns = React.useMemo(() => {
    return [...baseColumns, actionsColumn];
  }, [baseColumns, actionsColumn]);

  return (
    <>
      <DataTable columns={columns} data={data} loading={loading} />

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
