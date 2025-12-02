/**
 * Role People Tab
 *
 * Displays people assigned to this role with their details.
 */

"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import type { PersonAssignmentDTO } from "@/interface-adapters/queries/role-detail.query";

interface RolePeopleTabProps {
  people: PersonAssignmentDTO[];
}

export function RolePeopleTab({ people }: RolePeopleTabProps) {
  const columns: ColumnDef<PersonAssignmentDTO>[] = [
    {
      accessorKey: "personName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Person" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("personName") as string;
        const personId = row.original.personId;
        return (
          <Link
            href={`/persons/${personId}`}
            className="text-primary font-medium hover:underline"
          >
            {name}
          </Link>
        );
      },
      meta: {
        label: "Person",
      },
    },
    {
      accessorKey: "personEmail",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("personEmail") as string;
        return (
          <span className="text-muted-foreground text-sm">{email || "-"}</span>
        );
      },
      meta: {
        label: "Email",
      },
    },
    {
      accessorKey: "primaryRole",
      header: "Primary Role",
      cell: ({ row }) => {
        const primaryRole = row.getValue("primaryRole") as string;
        return (
          <span className="text-sm">
            {primaryRole || (
              <span className="text-muted-foreground italic">None</span>
            )}
          </span>
        );
      },
      meta: {
        label: "Primary Role",
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("startDate"));
        return (
          <span className="text-muted-foreground text-sm">
            {format(date, "MMM d, yyyy")}
          </span>
        );
      },
      meta: {
        label: "Start Date",
      },
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => {
        const endDate = row.getValue("endDate") as Date | null;
        return (
          <span className="text-muted-foreground text-sm">
            {endDate ? format(new Date(endDate), "MMM d, yyyy") : "Ongoing"}
          </span>
        );
      },
      meta: {
        label: "End Date",
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return isActive ? (
          <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
        ) : (
          <Badge variant="secondary">Ended</Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      meta: {
        label: "Status",
      },
    },
  ];

  return (
    <div className="space-y-4">
      {people.length === 0 ? (
        <div className="text-muted-foreground border-muted rounded-lg border p-8 text-center">
          <p className="font-medium">No people assigned to this role</p>
          <p className="mt-1 text-sm">
            People will appear here when they are assigned to this role.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={people}
          searchable
          searchKey="personName"
          searchPlaceholder="Search people..."
          showColumnToggle
          pagination={{
            pageSize: 10,
          }}
          emptyMessage="No people found."
        />
      )}
    </div>
  );
}
