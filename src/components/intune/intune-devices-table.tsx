"use no memo";
"use client";

/**
 * Intune Devices Table
 *
 * Data table component for displaying Intune devices.
 * Supports row selection for bulk operations.
 */

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ExternalLink, Laptop, Monitor } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
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
import type { IntuneDeviceDTO } from "@/interface-adapters/dtos/generated/intune-device.dto";
import {
  getComplianceStateLabel,
  getComplianceStateColor,
  getOwnershipTypeLabel,
  getOwnershipTypeColor,
} from "@/interface-adapters/presenters/intune-device.presenter";

interface IntuneDevicesTableProps {
  devices: IntuneDeviceDTO[];
  isLoading?: boolean;
  onRefresh?: () => void;
  selectable?: boolean;
  onSelectionChange?: (selectedDevices: IntuneDeviceDTO[]) => void;
}

export function IntuneDevicesTable({
  devices,
  isLoading,
  selectable = false,
  onSelectionChange,
}: IntuneDevicesTableProps) {
  const columns = useMemo<ColumnDef<IntuneDeviceDTO>[]>(
    () => [
      // Selection column (conditionally added)
      ...(selectable
        ? [
            {
              id: "select",
              header: ({
                table,
              }: {
                table: {
                  getIsAllPageRowsSelected: () => boolean;
                  getIsSomePageRowsSelected: () => boolean;
                  toggleAllPageRowsSelected: (value?: boolean) => void;
                };
              }) => (
                <Checkbox
                  checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                  }
                  onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                  }
                  aria-label="Select all"
                />
              ),
              cell: ({
                row,
              }: {
                row: {
                  getIsSelected: () => boolean;
                  toggleSelected: (value?: boolean) => void;
                  getCanSelect: () => boolean;
                };
              }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                  aria-label="Select row"
                  disabled={!row.getCanSelect()}
                />
              ),
              enableSorting: false,
              enableHiding: false,
            } as ColumnDef<IntuneDeviceDTO>,
          ]
        : []),
      {
        accessorKey: "deviceName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Device Name" />
        ),
        cell: ({ row }) => {
          const device = row.original;
          const isWindows = device.operatingSystem
            ?.toLowerCase()
            .includes("windows");
          return (
            <div className="flex items-center gap-2">
              {isWindows ? (
                <Monitor className="text-muted-foreground h-4 w-4" />
              ) : (
                <Laptop className="text-muted-foreground h-4 w-4" />
              )}
              <Link
                href={`/intune/devices/${device.id}`}
                className="font-medium hover:underline"
              >
                {device.deviceName}
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: "serialNumber",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Serial Number" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.getValue("serialNumber") ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "operatingSystem",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="OS" />
        ),
        cell: ({ row }) => {
          const os = row.getValue("operatingSystem") as string | null;
          const version = row.original.osVersion;
          return (
            <div className="flex flex-col">
              <span>{os ?? "-"}</span>
              {version && (
                <span className="text-muted-foreground text-xs">{version}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "complianceState",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Compliance" />
        ),
        cell: ({ row }) => {
          const state = row.getValue(
            "complianceState",
          ) as IntuneDeviceDTO["complianceState"];
          return (
            <Badge variant={getComplianceStateColor(state)}>
              {getComplianceStateLabel(state)}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "ownershipType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ownership" />
        ),
        cell: ({ row }) => {
          const type = row.getValue(
            "ownershipType",
          ) as IntuneDeviceDTO["ownershipType"];
          return (
            <Badge variant={getOwnershipTypeColor(type)}>
              {getOwnershipTypeLabel(type)}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "userDisplayName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Assigned User" />
        ),
        cell: ({ row }) => {
          const name = row.getValue("userDisplayName") as string | null;
          const email = row.original.userPrincipalName;
          return name ? (
            <div className="flex flex-col">
              <span>{name}</span>
              {email && (
                <span className="text-muted-foreground text-xs">{email}</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "linkedAssetTag",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Linked Asset" />
        ),
        cell: ({ row }) => {
          const assetTag = row.original.linkedAssetTag;
          const assetId = row.original.linkedAssetId;
          if (!assetTag || !assetId) {
            return <span className="text-muted-foreground">Not linked</span>;
          }
          return (
            <Link
              href={`/assets/${assetTag}`}
              className="text-primary hover:underline"
            >
              {assetTag}
            </Link>
          );
        },
      },
      {
        accessorKey: "lastSyncDateTime",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Sync" />
        ),
        cell: ({ row }) => {
          const date = row.getValue("lastSyncDateTime") as string | null;
          if (!date) return <span className="text-muted-foreground">-</span>;
          return (
            <span className="text-sm">
              {new Date(date).toLocaleDateString()}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const device = row.original;
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
                <DropdownMenuItem asChild>
                  <Link href={`/intune/devices/${device.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(device.intuneDeviceId)
                  }
                >
                  Copy Intune ID
                </DropdownMenuItem>
                {device.serialNumber && (
                  <DropdownMenuItem
                    onClick={() =>
                      navigator.clipboard.writeText(device.serialNumber!)
                    }
                  >
                    Copy Serial Number
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [selectable],
  );

  return (
    <DataTable
      columns={columns}
      data={devices}
      loading={isLoading}
      selectable={selectable}
      onSelectionChange={onSelectionChange}
    />
  );
}
