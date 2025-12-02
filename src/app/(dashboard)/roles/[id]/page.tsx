/**
 * Role Detail Page
 *
 * Server component for viewing a single role's details (360-degree view).
 * Read-only interface for business roles.
 */

import { notFound } from "next/navigation";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getRoleByIdAction } from "@/interface-adapters/controllers/role.controller";
import { getRoleDetailAction } from "@/interface-adapters/controllers/role-details.controller";
import { RoleDetailPageClient } from "@/components/roles/business/role-detail-page-client";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

interface RoleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const { id } = await params;

  await requireFeatureAndPermission(
    "FOUNDATION",
    PERMISSIONS.ROLES_VIEW,
    `/roles/${id}`,
  );

  // Fetch data in parallel
  const [roleResult, detailResult] = await Promise.all([
    getRoleByIdAction(id),
    getRoleDetailAction(id),
  ]);

  if (!roleResult.success || !roleResult.data) {
    notFound();
  }

  return (
    <RoleDetailPageClient
      role={roleResult.data}
      peopleAssigned={
        detailResult.success ? detailResult.data.peopleAssigned : []
      }
      hierarchy={detailResult.success ? detailResult.data.hierarchy : null}
      stats={detailResult.success ? detailResult.data.stats : null}
    />
  );
}
