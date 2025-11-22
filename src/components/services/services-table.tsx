/**
 * Services Table Component
 */

"use client";
"use no memo";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Eye, Pencil, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import type { ServiceDTO } from "@/interface-adapters/presenters/service.presenter";
import { deleteServiceAction } from "@/interface-adapters/controllers/service.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import type {
  ServiceType} from "@/generated/prisma";
import {
  ServiceStatus,
  CriticalityLevel
} from "@/generated/prisma";

interface ServicesTableProps {
  data: ServiceDTO[];
  loading?: boolean;
}

export function ServicesTable({ data, loading = false }: ServicesTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [serviceToDelete, setServiceToDelete] =
    React.useState<ServiceDTO | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { hasPermission } = usePermissions();

  const handleDelete = async (service: ServiceDTO) => {
    setIsDeleting(true);
    try {
      const result = await deleteServiceAction(service.id);
      if (result.success) {
        toast.success("Service deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete service");
      }
    } catch (_error) {
      toast.error("Failed to delete service");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const getStatusBadgeVariant = (
    status: ServiceStatus,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case ServiceStatus.PRODUCTION:
        return "default";
      case ServiceStatus.RETIRED:
        return "secondary";
      case ServiceStatus.UAT:
        return "outline";
      case ServiceStatus.DEVELOPMENT:
        return "outline";
      case ServiceStatus.DR:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getCriticalityBadgeVariant = (
    criticality: CriticalityLevel,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (criticality) {
      case CriticalityLevel.CRITICAL:
        return "destructive";
      case CriticalityLevel.HIGH:
        return "default";
      case CriticalityLevel.MEDIUM:
        return "outline";
      case CriticalityLevel.LOW:
        return "secondary";
      default:
        return "secondary";
    }
  };

  const columns: ColumnDef<ServiceDTO>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Service Name" />
      ),
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link
              href={`/services/${service.id}`}
              className="text-primary font-medium hover:underline"
            >
              {service.name}
            </Link>
            {service.isEssentialService && (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            )}
          </div>
        );
      },
      meta: {
        label: "Service Name",
      },
    },
    {
      accessorKey: "serviceType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("serviceType") as ServiceType;
        return (
          <span className="text-sm">
            {type.replace(/_/g, " ").toLowerCase()}
          </span>
        );
      },
      meta: {
        label: "Type",
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "currentStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("currentStatus") as ServiceStatus;
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {status.replace(/_/g, " ")}
          </Badge>
        );
      },
      meta: {
        label: "Status",
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "criticality",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Criticality" />
      ),
      cell: ({ row }) => {
        const criticality = row.getValue("criticality") as CriticalityLevel;
        return (
          <Badge variant={getCriticalityBadgeVariant(criticality)}>
            {criticality}
          </Badge>
        );
      },
      meta: {
        label: "Criticality",
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "businessImpactLevel",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Business Impact" />
      ),
      cell: ({ row }) => {
        const impact = row.getValue("businessImpactLevel") as string;
        return <span className="text-sm">{impact}</span>;
      },
      meta: {
        label: "Business Impact",
      },
    },
    {
      accessorKey: "vendorName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor" />
      ),
      cell: ({ row }) => {
        const vendorName = row.original.vendorName;
        return (
          <span className="text-sm">
            {vendorName || <span className="text-muted-foreground">—</span>}
          </span>
        );
      },
      meta: {
        label: "Vendor",
      },
    },
    {
      accessorKey: "deploymentDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Deployed" />
      ),
      cell: ({ row }) => {
        const deploymentDate = row.getValue("deploymentDate") as string | null;
        if (!deploymentDate) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        return (
          <span className="text-sm">
            {format(new Date(deploymentDate), "MMM d, yyyy")}
          </span>
        );
      },
      meta: {
        label: "Deployed",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const service = row.original;
        const canView = hasPermission(PERMISSIONS.SERVICES_VIEW);
        const canUpdate = hasPermission(PERMISSIONS.SERVICES_UPDATE);
        const canDelete = hasPermission(PERMISSIONS.SERVICES_DELETE);

        if (!canView && !canUpdate && !canDelete) {
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
              {canView && (
                <DropdownMenuItem
                  onClick={() => router.push(`/services/${service.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {canUpdate && (
                <DropdownMenuItem
                  onClick={() => router.push(`/services/${service.id}/edit`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setServiceToDelete(service);
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
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        initialColumnVisibility={{
          businessImpactLevel: false,
          deploymentDate: false,
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete service &quot;{serviceToDelete?.name}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (serviceToDelete) {
                  handleDelete(serviceToDelete);
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
