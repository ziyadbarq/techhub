/**
 * Kit Checkouts Table Component
 */

"use client";
"use no memo";

import { type ColumnDef } from "@tanstack/react-table";
import { Eye, Package, User } from "lucide-react";
import { formatDate } from "@/lib/utils/date-format";
import { Button } from "@/components/ui/button";
import { EntityDisplay } from "@/components/ui/entity-display";
import { DataTable } from "@/components/ui/data-table";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import type { AssetKitCheckoutDTO } from "@/interface-adapters/dtos/generated/asset-kit-checkout.dto";

interface KitCheckoutsTableProps {
  data: AssetKitCheckoutDTO[];
  loading?: boolean;
  onView: (checkout: AssetKitCheckoutDTO) => void;
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  OVERDUE: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  PARTIAL_RETURN: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  RETURNED: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  EXTENDED: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
};

export function KitCheckoutsTable({
  data,
  loading,
  onView,
}: KitCheckoutsTableProps) {
  const columns: ColumnDef<AssetKitCheckoutDTO>[] = [
    {
      accessorKey: "kitName",
      header: "Kit",
      cell: ({ row }) => (
        <EntityDisplay name={row.original.kitName} icon={Package} />
      ),
      meta: { label: "Kit" },
    },
    {
      accessorKey: "personName",
      header: "Checked Out To",
      cell: ({ row }) => (
        <EntityDisplay name={row.original.personName} icon={User} />
      ),
      meta: { label: "Checked Out To" },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <Badge variant="outline" className={statusColors[status] || ""}>
            {status.replace(/_/g, " ")}
          </Badge>
        );
      },
      meta: { label: "Status" },
    },
    {
      accessorKey: "checkoutDate",
      header: "Checkout Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.getValue<string>("checkoutDate"))}
        </div>
      ),
      meta: { label: "Checkout Date" },
    },
    {
      accessorKey: "expectedReturnDate",
      header: "Expected Return",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.getValue<string | null>("expectedReturnDate")) ||
            "N/A"}
        </div>
      ),
      meta: { label: "Expected Return", hiddenByDefault: true },
    },
    {
      accessorKey: "actualReturnDate",
      header: "Actual Return",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.getValue<string | null>("actualReturnDate")) || "-"}
        </div>
      ),
      meta: { label: "Actual Return", hiddenByDefault: true },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Enhanced column visibility with localStorage persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<AssetKitCheckoutDTO>({
      storageKey: "kit-checkouts-table-columns",
      columns,
    });

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      searchable
      searchKey="kitName"
      searchPlaceholder="Filter by kit name..."
      emptyMessage="No checkouts found."
      controlledState={{ columnVisibility: visibility }}
      onColumnVisibilityChange={onVisibilityChange}
    />
  );
}
