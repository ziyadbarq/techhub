/**
 * Asset Assignments Table Component
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Star,
  Tag,
  User,
  Building2,
  MapPin,
  Server,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EntityDisplay } from "@/components/ui/entity-display";
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

import type { AssetAssignmentDTO } from "@/interface-adapters/presenters/asset-assignment.presenter";
import { deleteAssetAssignmentAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [assetAssignmentToDelete, setAssetAssignmentToDelete] =
    React.useState<AssetAssignmentDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (assetAssignment: AssetAssignmentDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteAssetAssignmentAction(assetAssignment.id);
      if (result.success) {
        toast.success("Asset assignment deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete asset assignment");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAssetAssignmentToDelete(null);
    }
  };

  const columns: ColumnDef<AssetAssignmentDTO>[] = [
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
    {
      id: "actions",
      cell: ({ row }) => {
        const assetAssignment = row.original;
        const canUpdate = hasPermission(PERMISSIONS.ASSET_ASSIGNMENTS_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.ASSET_ASSIGNMENTS_DELETE);

        if (!canUpdate && !canDelete) {
          return null;
        }

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
                <DropdownMenuItem onClick={() => onEdit(assetAssignment)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setAssetAssignmentToDelete(assetAssignment);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this assignment. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (assetAssignmentToDelete) {
                  handleDelete(assetAssignmentToDelete);
                }
              }}
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
