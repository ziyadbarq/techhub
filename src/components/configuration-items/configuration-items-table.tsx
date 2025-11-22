/**
 * Configuration Items Table Component
 */

"use client";
"use no memo";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConfigurationItemDTO } from "@/interface-adapters/dtos/generated/configuration-item.dto";
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { deleteConfigurationItemAction } from "@/interface-adapters/controllers/configuration-item.controller";
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

interface ConfigurationItemsTableProps {
  data: ConfigurationItemDTO[];
  loading?: boolean;
  onView: (item: ConfigurationItemDTO) => void;
  onEdit: (item: ConfigurationItemDTO) => void;
  onRefresh: () => void;
}

const criticalityColors: Record<string, string> = {
  LOW: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  HIGH: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

const environmentColors: Record<string, string> = {
  PROD: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  UAT: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  DEV: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  TEST: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  DR: "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20",
  OTHER: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
};

export function ConfigurationItemsTable({
  data,
  loading,
  onView,
  onEdit,
  onRefresh,
}: ConfigurationItemsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ConfigurationItemDTO | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteConfigurationItemAction(itemToDelete.id);
      if (result.success) {
        toast.success("Configuration item deleted successfully");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete configuration item");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const columns: ColumnDef<ConfigurationItemDTO>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue<string>("name")}</div>
      ),
    },
    {
      accessorKey: "ciClassName",
      header: "CI Class",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.ciClassName || "—"}</div>
      ),
    },
    {
      accessorKey: "ciKey",
      header: "CI Key",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.original.ciKey || "—"}</div>
      ),
    },
    {
      accessorKey: "criticality",
      header: "Criticality",
      cell: ({ row }) => {
        const criticality = row.original.criticality;
        if (!criticality)
          return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant="outline" className={criticalityColors[criticality]}>
            {criticality}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.original.criticality === value;
      },
    },
    {
      accessorKey: "environment",
      header: "Environment",
      cell: ({ row }) => {
        const environment = row.original.environment;
        if (!environment)
          return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant="outline" className={environmentColors[environment]}>
            {environment}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.original.environment === value;
      },
    },
    {
      accessorKey: "primaryOwnerName",
      header: "Owner",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.primaryOwnerName || "—"}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(row.original)}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <PermissionGuard permission={PERMISSIONS.CONFIGURATION_ITEMS_UPDATE}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(row.original)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.CONFIGURATION_ITEMS_DELETE}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setItemToDelete(row.original);
                setDeleteDialogOpen(true);
              }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Input
            placeholder="Search by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Select
            value={
              (table.getColumn("criticality")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) =>
              table.getColumn("criticality")?.setFilterValue(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Criticality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Criticality</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={
              (table.getColumn("environment")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) =>
              table.getColumn("environment")?.setFilterValue(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Environments</SelectItem>
              <SelectItem value="PROD">Production</SelectItem>
              <SelectItem value="UAT">UAT</SelectItem>
              <SelectItem value="DEV">Development</SelectItem>
              <SelectItem value="TEST">Test</SelectItem>
              <SelectItem value="DR">Disaster Recovery</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No configuration items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
