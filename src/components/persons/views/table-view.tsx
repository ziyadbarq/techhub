/**
 * Table View Component
 * TanStack Table implementation for persons with CRUD actions
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import { EmployeeAvatar } from "@/components/employee-directory/employee-avatar";

interface TableViewProps {
  persons: EmployeeDirectoryDTO[];
  isLoading: boolean;
  onViewReportingChain?: (person: EmployeeDirectoryDTO) => void;
  onEdit?: (person: EmployeeDirectoryDTO) => void;
  onDelete?: (person: EmployeeDirectoryDTO) => void;
}

export function TableView({
  persons,
  isLoading,
  onViewReportingChain,
  onEdit,
  onDelete,
}: TableViewProps) {
  const columns: ColumnDef<EmployeeDirectoryDTO>[] = [
    {
      id: "person",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Person" />
      ),
      cell: ({ row }) => {
        const person = row.original;
        return (
          <div className="flex items-center gap-3">
            <EmployeeAvatar
              firstName={person.firstName}
              lastName={person.lastName}
              size="sm"
            />
            <div className="flex flex-col">
              <span className="font-medium">{person.fullName}</span>
              {person.employeeId && (
                <span className="text-muted-foreground text-xs">
                  ID: {person.employeeId}
                </span>
              )}
            </div>
          </div>
        );
      },
      meta: {
        label: "Person",
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => {
        const title = row.getValue("title") as string | null;
        return title ? (
          <span className="text-sm">{title}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
      meta: {
        label: "Title",
      },
    },
    {
      id: "department",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Department" />
      ),
      cell: ({ row }) => {
        const person = row.original;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="max-w-[150px] truncate text-sm">
              {person.orgUnitName}
            </span>
          </div>
        );
      },
      meta: {
        label: "Department",
      },
    },
    {
      id: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => {
        const person = row.original;
        if (!person.locationName && !person.office) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="max-w-[120px] truncate text-sm">
              {person.office || person.locationName}
            </span>
          </div>
        );
      },
      meta: {
        label: "Location",
      },
    },
    {
      id: "manager",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Manager" />
      ),
      cell: ({ row }) => {
        const person = row.original;
        if (!person.managerName) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <span className="max-w-[150px] truncate text-sm">
            {person.managerName}
          </span>
        );
      },
      meta: {
        label: "Manager",
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const person = row.original;
        return (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8"
                    asChild
                  >
                    <a href={`mailto:${person.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{person.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {(person.phone || person.mobile) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={`tel:${person.mobile || person.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{person.mobile || person.phone}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
      meta: {
        label: "Contact",
      },
    },
    {
      id: "reports",
      header: "Reports",
      cell: ({ row }) => {
        const person = row.original;
        if (person.directReportsCount === 0) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {person.directReportsCount}
          </Badge>
        );
      },
      meta: {
        label: "Reports",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const person = row.original;
        const hasActions = onEdit || onDelete;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => onViewReportingChain?.(person)}
            >
              View Chain
              <ChevronRight className="h-4 w-4" />
            </Button>

            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(person)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(person)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={persons}
      loading={isLoading}
      showColumnToggle
      emptyMessage="No persons found matching your search criteria."
      pagination={{ pageSize: 20 }}
      initialColumnVisibility={{
        location: false,
        manager: false,
        contact: false,
        reports: false,
      }}
    />
  );
}
