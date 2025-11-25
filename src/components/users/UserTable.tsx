/**
 * User Table Component
 *
 * Advanced data table for users with roles using TanStack Table.
 * Features: sorting, filtering, pagination, role badges.
 */

"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Shield, Mail, Users, KeyRound } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BulkRoleAssignmentModal } from "@/components/users/BulkRoleAssignmentModal";
import { InlineRoleEditor } from "@/components/users/InlineRoleEditor";
import { UserRoleHistory } from "@/components/users/UserRoleHistory";
import { PasswordResetDialog } from "@/components/user-provisioning/PasswordResetDialog";

import type { UserWithRolesDTO } from "@/interface-adapters/controllers/user-role.controller";

interface UserTableProps {
  data: UserWithRolesDTO[];
  availableRoles: { id: string; name: string; displayName: string }[];
  loading?: boolean;
  onUpdate?: () => void;
}

export function UserTable({
  data,
  availableRoles,
  loading = false,
  onUpdate,
}: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = React.useState<UserWithRolesDTO[]>(
    [],
  );
  const [bulkModalOpen, setBulkModalOpen] = React.useState(false);
  const [passwordResetUser, setPasswordResetUser] = React.useState<{
    id: string;
    email: string;
  } | null>(null);

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const columns: ColumnDef<UserWithRolesDTO>[] = [
    {
      accessorKey: "user",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || user.email}
              />
              <AvatarFallback>
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.name || "Unnamed User"}</span>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Mail className="h-3 w-3" />
                {user.email}
              </span>
            </div>
          </div>
        );
      },
      meta: {
        label: "User",
      },
    },
    {
      accessorKey: "roles",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Roles" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <InlineRoleEditor
            userId={user.id}
            userEmail={user.email}
            roles={user.roles}
            availableRoles={availableRoles}
            onUpdate={onUpdate}
          />
        );
      },
      enableSorting: false,
      meta: {
        label: "Roles",
      },
    },
    {
      accessorKey: "emailVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Verified" />
      ),
      cell: ({ row }) => {
        const verified = row.getValue("emailVerified") as Date | null;
        return verified ? (
          <Badge variant="default" className="bg-success text-xs text-white">
            Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Not Verified
          </Badge>
        );
      },
      meta: {
        label: "Verified",
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <span className="text-muted-foreground text-sm">
            {format(date, "MMM d, yyyy")}
          </span>
        );
      },
      meta: {
        label: "Created",
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" forceMount>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/users/${encodeURIComponent(user.email)}/roles`}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Roles
                </Link>
              </DropdownMenuItem>
              <UserRoleHistory
                userId={user.id}
                userEmail={user.email}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Mail className="mr-2 h-4 w-4" />
                    View Role History
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  setPasswordResetUser({ id: user.id, email: user.email })
                }
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                }}
              >
                Copy User ID
              </DropdownMenuItem>
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
        searchable
        searchKey="user"
        searchPlaceholder="Search users by name or email..."
        showColumnToggle
        selectable
        onSelectionChange={setSelectedUsers}
        emptyMessage="No users found."
        pagination={{
          pageSize: 10,
        }}
        toolbarActions={
          selectedUsers.length > 0 ? (
            <Button
              onClick={() => setBulkModalOpen(true)}
              variant="default"
              size="sm"
            >
              <Users className="mr-2 h-4 w-4" />
              Assign Roles ({selectedUsers.length})
            </Button>
          ) : null
        }
      />

      <BulkRoleAssignmentModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        selectedUsers={selectedUsers}
        availableRoles={availableRoles}
        onSuccess={() => {
          setSelectedUsers([]);
          onUpdate?.();
        }}
      />

      {passwordResetUser ? (
        <PasswordResetDialog
          userId={passwordResetUser.id}
          userEmail={passwordResetUser.email}
          trigger={null}
          open
          onOpenChange={(open) => {
            if (!open) {
              setPasswordResetUser(null);
              onUpdate?.();
            }
          }}
        />
      ) : null}
    </>
  );
}
