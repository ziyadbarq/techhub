import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { hasPermission, requirePermission } from "@/lib/permissions/server";
import { AccessServicesClient } from "./access-services-client";
import { listAccessServicesAction } from "@/interface-adapters/controllers/access-service.controller";

export const dynamic = "force-dynamic";

export default async function AccessServicesPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_VIEW);

  // Viewing the catalog isn't changing it: each change needs its own
  // permission (System Administrator and Workflow Officer hold them).
  const [create, update, manage, result] = await Promise.all([
    hasPermission(PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_CREATE),
    hasPermission(PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_UPDATE),
    hasPermission(PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_MANAGE),
    listAccessServicesAction({ activeOnly: true }),
  ]);
  const services = result.success ? result.data : [];

  return (
    <AccessServicesClient
      initialServices={services ?? []}
      can={{ create, update, manage }}
    />
  );
}
