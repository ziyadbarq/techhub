/**
 * Vendor Services Tab
 *
 * Displays services and disposals handled by this vendor.
 */

"use no memo";
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import { Server, Recycle, AlertCircle } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listVendorServicesAction,
  listVendorDisposalsAction,
  type VendorServiceDTO,
  type VendorDisposalDTO,
} from "@/interface-adapters/controllers/vendor-details.controller";
import { formatSAR } from "@/lib/utils";

interface VendorServicesTabProps {
  vendorId: string;
  servicesCount: number;
  disposalsCount: number;
}

const CRITICALITY_CONFIG: Record<
  string,
  { variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  CRITICAL: { variant: "destructive" },
  HIGH: { variant: "default" },
  MEDIUM: { variant: "secondary" },
  LOW: { variant: "outline" },
};

export function VendorServicesTab({
  vendorId,
  servicesCount,
  disposalsCount,
}: VendorServicesTabProps) {
  const [services, setServices] = useState<VendorServiceDTO[]>([]);
  const [disposals, setDisposals] = useState<VendorDisposalDTO[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingDisposals, setLoadingDisposals] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (servicesCount > 0) {
        setLoadingServices(true);
        const result = await listVendorServicesAction(vendorId);
        if (result.success && result.data) {
          setServices(result.data);
        }
        setLoadingServices(false);
      } else {
        setLoadingServices(false);
      }

      if (disposalsCount > 0) {
        setLoadingDisposals(true);
        const result = await listVendorDisposalsAction(vendorId);
        if (result.success && result.data) {
          setDisposals(result.data);
        }
        setLoadingDisposals(false);
      } else {
        setLoadingDisposals(false);
      }
    }
    loadData();
  }, [vendorId, servicesCount, disposalsCount]);

  const serviceColumns: ColumnDef<VendorServiceDTO>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Service" />
      ),
      cell: ({ row }) => {
        const service = row.original;
        return (
          <Link
            href={`/services/${service.id}`}
            className="text-primary font-medium hover:underline"
          >
            {service.name}
          </Link>
        );
      },
      meta: {
        label: "Service",
      },
    },
    {
      accessorKey: "serviceType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("serviceType") as string;
        return <Badge variant="outline">{type}</Badge>;
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
        const isActive = status === "ACTIVE" || status === "OPERATIONAL";
        return (
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {status}
          </Badge>
        );
      },
      meta: {
        label: "Status",
      },
    },
    {
      accessorKey: "criticality",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Criticality" />
      ),
      cell: ({ row }) => {
        const criticality = row.getValue("criticality") as string;
        const config = CRITICALITY_CONFIG[criticality] ?? {
          variant: "secondary" as const,
        };
        return (
          <Badge variant={config.variant}>
            {criticality === "CRITICAL" && (
              <AlertCircle className="mr-1 h-3 w-3" />
            )}
            {criticality}
          </Badge>
        );
      },
      meta: {
        label: "Criticality",
      },
    },
  ];

  const disposalColumns: ColumnDef<VendorDisposalDTO>[] = [
    {
      accessorKey: "assetTag",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Asset" />
      ),
      cell: ({ row }) => {
        const disposal = row.original;
        return (
          <Link
            href={`/assets/${disposal.assetTag}`}
            className="text-primary font-medium hover:underline"
          >
            {disposal.assetTag}
          </Link>
        );
      },
      meta: {
        label: "Asset",
      },
    },
    {
      accessorKey: "disposalType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("disposalType") as string;
        return <Badge variant="outline">{type}</Badge>;
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
        const isCompleted = status === "COMPLETED";
        return (
          <Badge
            variant={isCompleted ? "default" : "secondary"}
            className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {status}
          </Badge>
        );
      },
      meta: {
        label: "Status",
      },
    },
    {
      accessorKey: "disposalDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const dateStr = row.getValue("disposalDate") as string | null;
        if (!dateStr) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const date = new Date(dateStr);
        return <span className="text-sm">{format(date, "MMM d, yyyy")}</span>;
      },
      meta: {
        label: "Date",
      },
    },
    {
      accessorKey: "disposalValue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
      ),
      cell: ({ row }) => {
        const value = row.getValue("disposalValue") as number | null;
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
  ];

  const hasNoData = servicesCount === 0 && disposalsCount === 0;

  if (hasNoData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Server className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4 text-center">
            No services or disposals found for this vendor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Services Section */}
      {servicesCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" />
              Services
              <Badge variant="secondary" className="ml-2">
                {servicesCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={serviceColumns}
              data={services}
              loading={loadingServices}
              searchable
              searchKey="name"
              searchPlaceholder="Search services..."
              emptyMessage="No services found."
              pagination={{
                pageSize: 5,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Disposals Section */}
      {disposalsCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Recycle className="h-4 w-4" />
              Asset Disposals
              <Badge variant="secondary" className="ml-2">
                {disposalsCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={disposalColumns}
              data={disposals}
              loading={loadingDisposals}
              searchable
              searchKey="assetTag"
              searchPlaceholder="Search disposals..."
              emptyMessage="No disposals found."
              pagination={{
                pageSize: 5,
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
