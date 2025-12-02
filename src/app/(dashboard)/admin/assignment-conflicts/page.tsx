/**
 * Assignment Conflicts Admin Page
 *
 * Allows admins to review and resolve conflicts between Intune and manual
 * asset assignments. Conflicts occur when Intune and manual sources disagree
 * on who an asset is assigned to.
 */

import type { Metadata } from "next";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { AssignmentConflictsPageClient } from "@/components/admin/assignment-conflicts-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assignment Conflicts - Admin",
  description:
    "Review and resolve conflicts between Intune and manual asset assignments",
};

export default async function AssignmentConflictsPage() {
  await requirePermission(PERMISSIONS.ASSET_ASSIGNMENTS_VIEW);

  return <AssignmentConflictsPageClient />;
}
