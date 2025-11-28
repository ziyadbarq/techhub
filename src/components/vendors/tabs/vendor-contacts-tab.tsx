/**
 * Vendor Contacts Tab
 *
 * Displays vendor contacts in a data table.
 */

"use no memo";
"use client";

import { useEffect, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Mail, Phone, Star, Users } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  listVendorContactsAction,
  type VendorContactDTO,
} from "@/interface-adapters/controllers/vendor-details.controller";

interface VendorContactsTabProps {
  vendorId: string;
}

export function VendorContactsTab({ vendorId }: VendorContactsTabProps) {
  const [contacts, setContacts] = useState<VendorContactDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContacts() {
      setLoading(true);
      const result = await listVendorContactsAction(vendorId);
      if (result.success && result.data) {
        setContacts(result.data);
      }
      setLoading(false);
    }
    loadContacts();
  }, [vendorId]);

  const columns: ColumnDef<VendorContactDTO>[] = [
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{contact.fullName}</span>
              {contact.isPrimary && (
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-600"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Primary
                </Badge>
              )}
            </div>
            {contact.title && (
              <span className="text-muted-foreground text-xs">
                {contact.title}
              </span>
            )}
          </div>
        );
      },
      meta: {
        label: "Name",
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as string | null;
        return role ? (
          <Badge variant="secondary">{role}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Role",
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        const email = row.getValue("email") as string | null;
        return email ? (
          <a
            href={`mailto:${email}`}
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            <Mail className="h-3 w-3" />
            {email}
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Email",
      },
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => {
        const contact = row.original;
        const phone = contact.phone || contact.mobile;
        return phone ? (
          <a
            href={`tel:${phone}`}
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            <Phone className="h-3 w-3" />
            {phone}
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      meta: {
        label: "Phone",
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
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
          <div className="text-muted-foreground">Loading contacts...</div>
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4 text-center">
            No contacts found for this vendor.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={contacts}
      loading={loading}
      searchable
      searchKey="fullName"
      searchPlaceholder="Search contacts..."
      emptyMessage="No contacts found."
      pagination={{
        pageSize: 10,
      }}
    />
  );
}
