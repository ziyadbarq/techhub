/**
 * Vendor Contacts Page
 */

import { VendorContactsPageClient } from "@/components/vendor-contacts/vendor-contacts-page-client";
import { listVendorContactsAction } from "@/interface-adapters/controllers/vendor-contact.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function VendorContactsPage() {
  await requirePermission(PERMISSIONS.VENDOR_CONTACTS_VIEW);

  const result = await listVendorContactsAction();
  const initialContacts = result.success ? result.data : [];

  return <VendorContactsPageClient initialContacts={initialContacts} />;
}
