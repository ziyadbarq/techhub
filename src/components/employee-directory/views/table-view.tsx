/**
 * Table View Component
 * TanStack Table implementation for employee directory
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
} from "lucide-react";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import { EmployeeAvatar } from "../employee-avatar";

interface TableViewProps {
  employees: EmployeeDirectoryDTO[];
  isLoading: boolean;
  onViewReportingChain?: (employee: EmployeeDirectoryDTO) => void;
}

export function TableView({
  employees,
  isLoading,
  onViewReportingChain,
}: TableViewProps) {
  const columns: ColumnDef<EmployeeDirectoryDTO>[] = [
    {
      id: "employee",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Employee" />
      ),
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div className="flex items-center gap-3">
            <EmployeeAvatar
              firstName={employee.firstName}
              lastName={employee.lastName}
              size="sm"
            />
            <div className="flex flex-col">
              <span className="font-medium">{employee.fullName}</span>
              {employee.employeeId && (
                <span className="text-muted-foreground text-xs">
                  ID: {employee.employeeId}
                </span>
              )}
            </div>
          </div>
        );
      },
      meta: {
        label: "Employee",
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
        const employee = row.original;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="max-w-[150px] truncate text-sm">
              {employee.orgUnitName}
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
        const employee = row.original;
        if (!employee.locationName && !employee.office) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="max-w-[120px] truncate text-sm">
              {employee.office || employee.locationName}
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
        const employee = row.original;
        if (!employee.managerName) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <span className="max-w-[150px] truncate text-sm">
            {employee.managerName}
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
        const employee = row.original;
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
                    <a href={`mailto:${employee.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{employee.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {(employee.phone || employee.mobile) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={`tel:${employee.mobile || employee.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{employee.mobile || employee.phone}</p>
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
        const employee = row.original;
        if (employee.directReportsCount === 0) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {employee.directReportsCount}
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
        const employee = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => onViewReportingChain?.(employee)}
          >
            View Chain
            <ChevronRight className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={employees}
      loading={isLoading}
      showColumnToggle
      emptyMessage="No employees found matching your search criteria."
      pagination={{ pageSize: 20 }}
    />
  );
}
