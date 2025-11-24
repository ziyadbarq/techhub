/**
 * Person Role Assignments Page
 */

import { PersonRoleAssignmentsPageClient } from "@/components/person-role-assignments/person-role-assignments-page-client";
import { listPersonRoleAssignmentsAction } from "@/interface-adapters/controllers/person-role-assignment.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function PersonRoleAssignmentsPage() {
  try {
    await requirePermission(PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/person-role-assignments");
    throw error;
  }

  const result = await listPersonRoleAssignmentsAction();
  const initialAssignments = result.success ? result.data : [];

  return (
    <PersonRoleAssignmentsPageClient initialAssignments={initialAssignments} />
  );
}
