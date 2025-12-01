/**
 * Person Role Assignments Page
 */

import { PersonRoleAssignmentsPageClient } from "@/components/person-role-assignments/person-role-assignments-page-client";
import { listPersonRoleAssignmentsAction } from "@/interface-adapters/controllers/person-role-assignment.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function PersonRoleAssignmentsPage() {
  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW,
    "/person-role-assignments",
  );

  const result = await listPersonRoleAssignmentsAction();
  const initialAssignments = result.success ? result.data : [];

  return (
    <PersonRoleAssignmentsPageClient initialAssignments={initialAssignments} />
  );
}
