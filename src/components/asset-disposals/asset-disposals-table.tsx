/**
 * Asset Disposals Table Component
 */

"use client";
"use no memo";

import { useState } from "react";
import { type ColumnDef, type ColumnFiltersState } from "@tanstack/react-table";
import { Tag } from "lucide-react";
import { disposalStatusColors } from "@/lib/utils/status-colors";
import { formatDate } from "@/lib/utils/date-format";
import { EntityDisplay } from "@/components/ui/entity-display";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssetDisposalDTO } from "@/interface-adapters/dtos/generated/asset-disposal.dto";
import { Badge } from "@/components/ui/badge";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { deleteAssetDisposalAction } from "@/interface-adapters/controllers/asset-disposal.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";

interface AssetDisposalsTableProps {
  data: AssetDisposalDTO[];
  loading?: boolean;
  onView: (disposal: AssetDisposalDTO) => void;
  onRefresh: () => void;
}

const disposalTypeLabels: Record<string, string> = {
  DONATION: "Donation",
  SALE: "Sale",
  RECYCLING: "Recycling",
  DESTRUCTION: "Destruction",
  OTHER: "Other",
};

// Column filterFn shared by the Select dropdowns: "all" passes everything.
const equalsOrAll = (
  row: { getValue: (id: string) => unknown },
  id: string,
  value: string,
) => value === "all" || row.getValue(id) === value;

export function AssetDisposalsTable({
  data,
  loading,
  onView,
  onRefresh,
}: AssetDisposalsTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const getFilter = (id: string) =>
    (columnFilters.find((f) => f.id === id)?.value as string) ?? "all";
  const setFilter = (id: string, value: string) =>
    setColumnFilters((prev) =>
      value === "all"
        ? prev.filter((f) => f.id !== id)
        : [...prev.filter((f) => f.id !== id), { id, value }],
    );

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<AssetDisposalDTO>({
    onDelete: (disposal) => deleteAssetDisposalAction(disposal.id),
    onSuccess: onRefresh,
    getItemName: (disposal) => `Disposal ${disposal.id.slice(0, 8)}`,
    entityName: "Asset Disposal",
  });

  const columns: ColumnDef<AssetDisposalDTO>[] = [
    buildSelectColumn<AssetDisposalDTO>(),
    {
      accessorKey: "assetId",
      header: "Asset",
      cell: ({ row }) => (
        <EntityDisplay name={row.original.assetTag} icon={Tag} />
      ),
      meta: { label: "Asset" },
    },
    {
      accessorKey: "disposalType",
      header: "Type",
      cell: ({ row }) => (
        <div>
          {disposalTypeLabels[row.getValue<string>("disposalType")] ||
            row.getValue<string>("disposalType")}
        </div>
      ),
      filterFn: equalsOrAll,
      meta: { label: "Type" },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <Badge
            variant="outline"
            className={disposalStatusColors[status] || ""}
          >
            {status.replace(/_/g, " ")}
          </Badge>
        );
      },
      filterFn: equalsOrAll,
      meta: { label: "Status" },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.getValue<string>("reason")}
        </div>
      ),
      meta: { label: "Reason", hiddenByDefault: true },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.getValue<string>("createdAt"))}
        </div>
      ),
      meta: { label: "Created", hiddenByDefault: true },
    },
    buildActionsColumn<AssetDisposalDTO>([
      {
        type: "view",
        label: "View",
        onClick: onView,
      },
      {
        type: "delete",
        label: "Delete",
        permission: PERMISSIONS.ASSETS_DELETE,
        variant: "destructive",
        separator: true,
        onClick: deleteDialog.openDialog,
      },
    ]),
  ];

  // Enhanced column visibility with localStorage persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<AssetDisposalDTO>({
      storageKey: "asset-disposals-table-columns",
      columns,
    });

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        selectable
        searchable
        searchKey="assetId"
        searchPlaceholder="Filter by asset ID..."
        emptyMessage="No disposals found."
        controlledState={{ columnFilters, columnVisibility: visibility }}
        onColumnFiltersChange={setColumnFilters}
        onColumnVisibilityChange={onVisibilityChange}
        filtersSlot={
          <>
            <Select
              value={getFilter("status")}
              onValueChange={(value) => setFilter("status", value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING_APPROVAL">
                  Pending Approval
                </SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="SANITIZED">Sanitized</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={getFilter("disposalType")}
              onValueChange={(value) => setFilter("disposalType", value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DONATION">Donation</SelectItem>
                <SelectItem value="SALE">Sale</SelectItem>
                <SelectItem value="RECYCLING">Recycling</SelectItem>
                <SelectItem value="DESTRUCTION">Destruction</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />
      <deleteDialog.DialogComponent />
    </>
  );
}
