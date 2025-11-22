"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { DataOwnershipDTO } from "@/interface-adapters/presenters/data-ownership.presenter";
import type { DataDomainDTO } from "@/interface-adapters/presenters/data-domain.presenter";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import { deleteDataOwnership } from "@/interface-adapters/controllers/data-ownership.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [dataOwnershipToDelete, setDataOwnershipToDelete] =
    React.useState<DataOwnershipDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  // Helper functions to get names from IDs
  const getDataDomainName = (id: string): string => {
    const domain = dataDomains.find((d) => d.id === id);
    return domain?.name || "Unknown Domain";
  };

  const getCIClassName = (id: string | null): string | null => {
    if (!id) return null;
    const ciClass = ciClasses.find((c) => c.id === id);
    return ciClass?.name || "Unknown CI Class";
  };

  const getAssetCategoryName = (id: string | null): string | null => {
    if (!id) return null;
    const category = assetCategories.find((c) => c.id === id);
    return category?.name || "Unknown Asset Category";
  };

  const getPersonName = (id: string | null): string | null => {
    if (!id) return null;
    const person = persons.find((p) => p.id === id);
    return person ? `${person.firstName} ${person.lastName}` : "Unknown Person";
  };

  const getOrgUnitName = (id: string | null): string | null => {
    if (!id) return null;
    const orgUnit = organizationUnits.find((o) => o.id === id);
    return orgUnit?.name || "Unknown Org Unit";
  };

  const getTargetDisplay = (ownership: DataOwnershipDTO): string => {
    if (ownership.ciClassId) {
      const name = getCIClassName(ownership.ciClassId);
      return `CI Class: ${name}`;
    } else if (ownership.assetCategoryId) {
      const name = getAssetCategoryName(ownership.assetCategoryId);
      return `Asset Category: ${name}`;
    }
    return "No Target";
  };

  const getOwnerDisplay = (ownership: DataOwnershipDTO): string => {
    if (ownership.ownerPersonId) {
      const name = getPersonName(ownership.ownerPersonId);
      return `Person: ${name}`;
    } else if (ownership.ownerOrgUnitId) {
      const name = getOrgUnitName(ownership.ownerOrgUnitId);
      return `Org Unit: ${name}`;
    }
    return "No Owner";
  };

  const handleDelete = async (dataOwnership: DataOwnershipDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteDataOwnership(dataOwnership.id);
      if (result.success) {
        toast.success("Data ownership deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete data ownership");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDataOwnershipToDelete(null);
    }
  };

  const columns: ColumnDef<DataOwnershipDTO>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
          <span className={`text-sm ${ownership.ownerPersonId || ownership.ownerOrgUnitId ? "" : "text-muted-foreground"}`}>
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
        const truncated = note.length > 50 ? `${note.substring(0, 50)}...` : note;
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
    {
      id: "actions",
      cell: ({ row }) => {
        const dataOwnership = row.original;
        const canUpdate = hasPermission(PERMISSIONS.DATA_OWNERSHIPS_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.DATA_OWNERSHIPS_DELETE);

        if (!canUpdate && !canDelete) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(dataOwnership)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setDataOwnershipToDelete(dataOwnership);
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} loading={loading} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this data ownership assignment?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                dataOwnershipToDelete && handleDelete(dataOwnershipToDelete)
              }
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
