/**
 * Vendor Contacts Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { VendorContactDTO } from "@/interface-adapters/presenters/vendor-contact.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import { listVendorContactsAction } from "@/interface-adapters/controllers/vendor-contact.controller";
import { VendorContactsTable } from "./vendor-contacts-table";
import { VendorContactForm } from "./vendor-contact-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface VendorContactsPageClientProps {
  initialContacts: VendorContactDTO[];
  vendors?: VendorDTO[];
  vendorId?: string;
}

export function VendorContactsPageClient({
  initialContacts,
  vendors = [],
  vendorId,
}: VendorContactsPageClientProps) {
  const [contacts, setContacts] = useState<VendorContactDTO[]>(initialContacts);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<VendorContactDTO | null>(
    null,
  );

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const result = await listVendorContactsAction();
      if (result.success) {
        setContacts(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (contact: VendorContactDTO) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingContact(null);
  };

  const handleSuccess = () => {
    loadContacts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendor Contacts</h2>
          <p className="text-muted-foreground">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.VENDOR_CONTACTS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Contact
          </Button>
        </PermissionGuard>
      </div>

      <VendorContactsTable
        data={contacts}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      <VendorContactForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        contact={editingContact}
        vendorId={vendorId ?? ""}
        vendors={vendors}
      />
    </div>
  );
}
