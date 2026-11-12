import { DataImportWizard } from "@/components/data-import/DataImportWizard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function AssetsDataImportPage() {
  await requireFeatureAndPermission("ASSETS", PERMISSIONS.ASSETS_CREATE, "/data-import");
  return <DataImportWizard initialEntityKey="UNIVERSAL_ASSETS" />;
}
