/**
 * Vendor Warranties Tab
 *
 * Displays warranties provided by this vendor with status indicators.
 */

"use no memo";
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import { Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  listVendorWarrantiesAction,
  type VendorWarrantyDTO,
} from "@/interface-adapters/controllers/vendor-details.controller";

interface VendorWarrantiesTabProps {
  vendorId: string;
  activeCount: number;
  expiringSoonCount: number;
}

export function VendorWarrantiesTab({
  vendorId,
  activeCount,
  expiringSoonCount,
}: VendorWarrantiesTabProps) {
  const [warranties, setWarranties] = useState<VendorWarrantyDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWarranties() {
      setLoading(true);
      const result = await listVendorWarrantiesAction(vendorId);
      if (result.success && result.data) {
        setWarranties(result.data);
      }
      setLoading(false);
    }
    loadWarranties();
  }, [vendorId]);

  const columns: ColumnDef<VendorWarrantyDTO>[] = [
    {
      accessorKey: "assetTag",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Asset" />
      ),
      cell: ({ row }) => {
        const warranty = row.original;
        return (
          <Link
            href={`/assets/${warranty.assetTag}`}
            className="text-primary font-medium hover:underline"
          >
            {warranty.assetTag}
          </Link>
        );
      },
      meta: {
        label: "Asset",
      },
    },
    {
      accessorKey: "coverageType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Coverage" />
      ),
      cell: ({ row }) => {
        const coverageType = row.getValue("coverageType") as string;
        return <Badge variant="outline">{coverageType}</Badge>;
      },
      meta: {
        label: "Coverage",
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
        const date = new Date(row.getValue("endDate") as string);
        return <span className="text-sm">{format(date, "MMM d, yyyy")}</span>;
      },
      meta: {
        label: "End Date",
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as
          | "active"
          | "expiring_soon"
          | "expired";
        switch (status) {
          case "active":
            return (
              <Badge className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Active
              </Badge>
            );
          case "expiring_soon":
            return (
              <Badge className="bg-amber-500 hover:bg-amber-600">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Expiring Soon
              </Badge>
            );
          case "expired":
            return (
              <Badge variant="secondary">
                <XCircle className="mr-1 h-3 w-3" />
                Expired
              </Badge>
            );
        }
      },
      meta: {
        label: "Status",
      },
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading warranties...</div>
        </CardContent>
      </Card>
    );
  }

  if (warranties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4 text-center">
            No warranties found for this vendor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning for expiring warranties */}
      {expiringSoonCount > 0 && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            Warranties Expiring Soon
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {expiringSoonCount} warrant{expiringSoonCount !== 1 ? "ies" : "y"}{" "}
            from this vendor will expire within the next 30 days.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Active</p>
              <p className="text-xl font-semibold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Expiring Soon</p>
              <p className="text-xl font-semibold">{expiringSoonCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              <Shield className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total</p>
              <p className="text-xl font-semibold">{warranties.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warranties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Warranties</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={warranties}
            loading={loading}
            searchable
            searchKey="assetTag"
            searchPlaceholder="Search warranties..."
            emptyMessage="No warranties found."
            pagination={{
              pageSize: 10,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
