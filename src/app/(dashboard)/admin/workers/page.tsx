import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { WorkerStatusDashboard } from "@/components/admin/workers/worker-status-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Worker Status",
};

export default async function WorkerStatusPage() {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    handlePermissionRedirect(error, "/admin/workers");
    redirect("/unauthorized");
  }

  return <WorkerStatusDashboard />;
}
