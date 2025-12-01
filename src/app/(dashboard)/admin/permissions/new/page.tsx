import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";
import { NewPermissionPageClient } from "./new-permission-page-client";

export const dynamic = "force-dynamic";

export default async function NewPermissionPage() {
  await requireFeatureAndPermission(
    "RBAC",
    PERMISSIONS.PERMISSIONS_CREATE,
    "/admin/permissions/new",
  );

  return <NewPermissionPageClient />;
}
