import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { AccessServicesClient } from "./access-services-client";
import { listAccessServicesAction } from "@/interface-adapters/controllers/access-service.controller";

export const dynamic = "force-dynamic";

export default async function AccessServicesPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_VIEW);

  const result = await listAccessServicesAction();
  const services = result.success ? result.data : [];

  return <AccessServicesClient initialServices={services ?? []} />;
}
