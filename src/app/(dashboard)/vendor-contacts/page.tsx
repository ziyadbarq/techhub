/**
 * Vendor Contacts Page
 */

import { VendorContactsPageClient } from "@/components/vendor-contacts/vendor-contacts-page-client";
import { listVendorContactsAction } from "@/interface-adapters/controllers/vendor-contact.controller";
import { listVendorsAction } from "@/interface-adapters/controllers/vendor.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function VendorContactsPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.VENDOR_CONTACTS_VIEW,
    "/vendor-contacts",
  );

  const result = await listVendorContactsAction();
  const initialContacts = result.success ? result.data : [];
  const vendorsResult = await listVendorsAction();
  const vendors = vendorsResult.success ? vendorsResult.data : [];

  return (
    <VendorContactsPageClient
      initialContacts={initialContacts}
      vendors={vendors}
    />
  );
}
