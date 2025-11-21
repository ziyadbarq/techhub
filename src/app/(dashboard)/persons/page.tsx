/**
 * Persons Page
 */

import { PersonsPageClient } from "@/components/persons/persons-page-client";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

export default async function PersonsPage() {
  await requirePermission(PERMISSIONS.PERSONS_VIEW);

  const result = await listPersonsAction();
  const initialPersons = result.success ? result.data : [];

  return <PersonsPageClient initialPersons={initialPersons} />;
}
