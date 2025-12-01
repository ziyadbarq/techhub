/**
 * Configuration Items Table Component
 */

"use client";
"use no memo";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { useDebounce } from "@/hooks/use-debounce";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/date-format";
import { getStatusBadgeClasses } from "@/lib/utils/status-colors";
import {
  CRITICALITY_STATUS_MAP,
  ENVIRONMENT_STATUS_MAP,
  isCIStale,
} from "./configuration-items-helpers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ConfigurationItemsViewState } from "./configuration-items-page-client";

const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
  ciKey: false,
  primaryOwnerName: false,
  updatedAt: false,
  actions: false,
};

interface ConfigurationItemsTableProps {
  data: ConfigurationItemDTO[];
  loading?: boolean;
  onView: (item: ConfigurationItemDTO) => void;
  onEdit: (item: ConfigurationItemDTO) => void;
  onRefresh: () => void;
  initialViewState?: ConfigurationItemsViewState;
}

export function ConfigurationItemsTable({
  data,
  loading,
  onView,
  onEdit,
  onRefresh,
  initialViewState,
}: ConfigurationItemsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ConfigurationItemDTO | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialViewState?.search ?? "");
  const [filters, setFilters] = useState({
    criticality: initialViewState?.criticality ?? "all",
    environment: initialViewState?.environment ?? "all",
    owner: initialViewState?.owner ?? "all",
    assetLink: initialViewState?.assetLink ?? "all",
  });
  const [density, setDensity] = useState<"comfortable" | "compact">(
    initialViewState?.density ?? "compact",
  );
  const initialColumnVisibility = useMemo<VisibilityState>(() => {
    const param = searchParams.get("hide");
    const base: VisibilityState = { ...DEFAULT_HIDDEN_COLUMNS };
    if (!param) return base;
    param
      .split(",")
      .filter(Boolean)
      .forEach((id) => {
        base[id] = false;
      });
    return base;
  }, [searchParams]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility,
  );

  const debouncedSearch = useDebounce(searchTerm, 250);

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
      meta: { label: "Name" },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onView(row.original)}
          className="text-left font-medium hover:underline"
        >
          {row.getValue<string>("name")}
        </button>
      ),
      filterFn: (row, _id, value) => {
        if (!value || typeof value !== "string") return true;
        const term = value.toLowerCase();
        return (
          row.original.name.toLowerCase().includes(term) ||
          (row.original.ciKey?.toLowerCase().includes(term) ?? false)
        );
      },
    },
    {
      accessorKey: "ciClassName",
      header: "CI Class",
      meta: { label: "CI Class" },
      cell: ({ row }) => (
        <div className="text-sm">{row.original.ciClassName || "—"}</div>
      ),
    },
    {
      accessorKey: "ciKey",
      header: "CI Key",
      meta: { label: "CI Key" },
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.original.ciKey || "—"}</div>
      ),
      enableHiding: true,
    },
    {
      accessorKey: "linkedAssetTag",
      header: "Asset",
      meta: { label: "Linked Asset" },
      cell: ({ row }) => {
        const assetTag = row.original.linkedAssetTag;
        if (!assetTag) {
          return (
            <Badge variant="outline" className="text-muted-foreground">
              Unlinked
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="font-mono text-xs">
            {assetTag}
          </Badge>
        );
      },
      filterFn: (row, _id, value) => {
        if (value === "unlinked") {
          return !row.original.linkedAssetTag;
        }
        return true;
      },
    },
    {
      accessorKey: "criticality",
      header: "Criticality",
      meta: { label: "Criticality" },
      cell: ({ row }) => {
        const criticality = row.original.criticality;
        if (!criticality)
          return <span className="text-muted-foreground">—</span>;
        return (
          <Badge
            variant="outline"
            className={getStatusBadgeClasses(
              CRITICALITY_STATUS_MAP[criticality] ?? "info",
            )}
          >
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
      meta: { label: "Environment" },
      cell: ({ row }) => {
        const environment = row.original.environment;
        if (!environment)
          return <span className="text-muted-foreground">—</span>;
        return (
          <Badge
            variant="outline"
            className={getStatusBadgeClasses(
              ENVIRONMENT_STATUS_MAP[environment] ?? "info",
            )}
          >
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
      meta: { label: "Owner" },
      cell: ({ row }) => (
        <div className="text-sm">{row.original.primaryOwnerName || "—"}</div>
      ),
      filterFn: (row, _id, value) => {
        if (value === "none") {
          return !row.original.primaryOwnerName;
        }
        return true;
      },
      enableHiding: true,
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      meta: { label: "Last Updated" },
      cell: ({ row }) => {
        const stale = isCIStale(row.original.updatedAt);
        return (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span>{formatRelativeTime(row.original.updatedAt)}</span>
            {stale && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50">
                Stale
              </Badge>
            )}
          </div>
        );
      },
      enableHiding: true,
    },
    {
      id: "actions",
      header: "Actions",
      meta: { label: "Actions" },
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
      enableHiding: true,
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
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onPaginationChange: setPagination,
  });

  useEffect(() => {
    table.getColumn("name")?.setFilterValue(debouncedSearch);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, table]);

  useEffect(() => {
    table.getColumn("criticality")?.setFilterValue(filters.criticality);
    table.getColumn("environment")?.setFilterValue(filters.environment);
    table.getColumn("primaryOwnerName")?.setFilterValue(filters.owner);
    table.getColumn("linkedAssetTag")?.setFilterValue(filters.assetLink);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filters, table]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const setParam = (key: string, value: string, defaultValue: string) => {
      if (!value || value === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    };

    setParam("q", debouncedSearch, "");
    setParam("criticality", filters.criticality, "all");
    setParam("environment", filters.environment, "all");
    setParam("owner", filters.owner, "all");
    setParam("assetLink", filters.assetLink, "all");
    setParam("density", density, "compact");
    const hiddenColumns = Object.entries(columnVisibility)
      .filter(([, isVisible]) => isVisible === false)
      .map(([id]) => id);
    setParam("hide", hiddenColumns.join(","), "");
    setParam("pageSize", String(pagination.pageSize), "25");
    setParam("page", String(pagination.pageIndex + 1), "1");

    const next = params.toString();
    const current = searchParams.toString();

    if (next === current) return;

    const query = next ? `?${next}` : "";
    router.replace(`${pathname}${query}`, { scroll: false });
  }, [
    debouncedSearch,
    filters,
    density,
    pagination.pageIndex,
    pagination.pageSize,
    columnVisibility,
    router,
    searchParams,
    pathname,
  ]);

  const presetFilters = useMemo(
    () => [
      {
        key: "prod-critical",
        label: "Prod Critical",
        description: "Critical items in production",
        apply: () => {
          table.getColumn("criticality")?.setFilterValue("CRITICAL");
          table.getColumn("environment")?.setFilterValue("PROD");
          setFilters((prev) => ({
            ...prev,
            criticality: "CRITICAL",
            environment: "PROD",
          }));
        },
      },
      {
        key: "unlinked-assets",
        label: "Unlinked to Assets",
        description: "CIs without a linked asset",
        apply: () => {
          table.getColumn("linkedAssetTag")?.setFilterValue("unlinked");
          setFilters((prev) => ({
            ...prev,
            assetLink: "unlinked",
          }));
        },
      },
      {
        key: "orphaned",
        label: "Orphaned Owners",
        description: "Missing primary owner",
        apply: () => {
          table.getColumn("primaryOwnerName")?.setFilterValue("none");
          setFilters((prev) => ({
            ...prev,
            owner: "none",
          }));
        },
      },
    ],
    [table],
  );

  const rowPaddingClass = density === "compact" ? "py-2" : "py-3";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        {/* Filters + Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <Input
              placeholder="Search by name or CI key..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="max-w-sm"
            />

            <Select
              value={filters.criticality}
              onValueChange={(value) => {
                table.getColumn("criticality")?.setFilterValue(value);
                setFilters((prev) => ({ ...prev, criticality: value }));
              }}
            >
              <SelectTrigger className="w-[170px]">
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
              value={filters.environment}
              onValueChange={(value) => {
                table.getColumn("environment")?.setFilterValue(value);
                setFilters((prev) => ({ ...prev, environment: value }));
              }}
            >
              <SelectTrigger className="w-[170px]">
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

            <Select
              value={filters.owner}
              onValueChange={(value) => {
                table.getColumn("primaryOwnerName")?.setFilterValue(value);
                setFilters((prev) => ({ ...prev, owner: value }));
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Ownership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                <SelectItem value="none">Missing owner</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.assetLink}
              onValueChange={(value) => {
                table.getColumn("linkedAssetTag")?.setFilterValue(value);
                setFilters((prev) => ({ ...prev, assetLink: value }));
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Asset Link" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unlinked">Unlinked only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    const label =
                      (column.columnDef.meta as { label?: string })?.label ||
                      column.id;
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {presetFilters.map((preset) => (
            <Tooltip key={preset.key}>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={preset.apply}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{preset.description}</TooltipContent>
            </Tooltip>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              table.resetColumnFilters();
              setSearchTerm("");
              setFilters({
                criticality: "all",
                environment: "all",
                owner: "all",
                assetLink: "all",
              });
              setDensity("compact");
              setPagination({ pageIndex: 0, pageSize: 25 });
            }}
          >
            Clear filters
          </Button>
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
                table.getRowModel().rows.map((row) => {
                  const stale = isCIStale(row.original.updatedAt);
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        stale && "bg-amber-50",
                        density === "compact" ? "text-sm" : "text-base",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={rowPaddingClass}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-2">
          <div className="text-muted-foreground text-sm">
            Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={(e) => {
                const size = Number(e.target.value);
                setPagination({ pageIndex: 0, pageSize: size });
              }}
              className="h-8 rounded-md border bg-transparent px-2 text-sm"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
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
    </TooltipProvider>
  );
}
