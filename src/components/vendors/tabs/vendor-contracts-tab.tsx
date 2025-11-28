/**
 * Vendor Contracts Tab
 *
 * Displays contracts with this vendor.
 */

"use no memo";
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listVendorContractsAction,
  type VendorContractDTO,
} from "@/interface-adapters/controllers/vendor-details.controller";
import { formatSAR } from "@/lib/utils";

interface VendorContractsTabProps {
  vendorId: string;
  activeCount: number;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    icon: React.ReactNode;
  }
> = {
  ACTIVE: {
    label: "Active",
    variant: "default",
    icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
  },
  EXPIRED: {
    label: "Expired",
    variant: "secondary",
    icon: <XCircle className="mr-1 h-3 w-3" />,
  },
  DRAFT: {
    label: "Draft",
    variant: "outline",
    icon: <Clock className="mr-1 h-3 w-3" />,
  },
  PENDING: {
    label: "Pending",
    variant: "outline",
    icon: <Clock className="mr-1 h-3 w-3" />,
  },
  TERMINATED: {
    label: "Terminated",
    variant: "secondary",
    icon: <XCircle className="mr-1 h-3 w-3" />,
  },
};

export function VendorContractsTab({
  vendorId,
  activeCount,
}: VendorContractsTabProps) {
  const [contracts, setContracts] = useState<VendorContractDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContracts() {
      setLoading(true);
      const result = await listVendorContractsAction(vendorId);
      if (result.success && result.data) {
        setContracts(result.data);
      }
      setLoading(false);
    }
    loadContracts();
  }, [vendorId]);

  const columns: ColumnDef<VendorContractDTO>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contract" />
      ),
      cell: ({ row }) => {
        const contract = row.original;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/contracts/${contract.id}`}
              className="text-primary font-medium hover:underline"
            >
              {contract.name}
            </Link>
            {contract.contractNumber && (
              <span className="text-muted-foreground text-xs">
                #{contract.contractNumber}
              </span>
            )}
          </div>
        );
      },
      meta: {
        label: "Contract",
      },
    },
    {
      accessorKey: "contractTypeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("contractTypeName") as string | null;
        return type ? (
          <Badge variant="outline">{type}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Type",
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const config = STATUS_CONFIG[status] ?? {
          label: status,
          variant: "secondary" as const,
          icon: null,
        };
        return (
          <Badge
            variant={config.variant}
            className={
              status === "ACTIVE" ? "bg-green-600 hover:bg-green-700" : ""
            }
          >
            {config.icon}
            {config.label}
          </Badge>
        );
      },
      meta: {
        label: "Status",
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("startDate") as string);
        return <span className="text-sm">{format(date, "MMM d, yyyy")}</span>;
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
        const dateStr = row.getValue("endDate") as string | null;
        if (!dateStr) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const date = new Date(dateStr);
        return <span className="text-sm">{format(date, "MMM d, yyyy")}</span>;
      },
      meta: {
        label: "End Date",
      },
    },
    {
      accessorKey: "totalValueSar",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("totalValueSar") as number | null;
        return value ? (
          <span className="text-sm font-medium">{formatSAR(value)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Value",
      },
    },
    {
      accessorKey: "autoRenew",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Auto-Renew" />
      ),
      cell: ({ row }) => {
        const autoRenew = row.getValue("autoRenew") as boolean;
        return autoRenew ? (
          <Badge variant="outline" className="border-green-500 text-green-600">
            <RefreshCw className="mr-1 h-3 w-3" />
            Yes
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">No</span>
        );
      },
      meta: {
        label: "Auto-Renew",
      },
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading contracts...</div>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4 text-center">
            No contracts found for this vendor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Active Contracts</p>
              <p className="text-xl font-semibold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              <FileText className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total Contracts</p>
              <p className="text-xl font-semibold">{contracts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={contracts}
            loading={loading}
            searchable
            searchKey="name"
            searchPlaceholder="Search contracts..."
            emptyMessage="No contracts found."
            pagination={{
              pageSize: 10,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
