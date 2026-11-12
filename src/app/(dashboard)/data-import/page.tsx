import Link from "next/link";
import { DataImportWizard } from "@/components/data-import/DataImportWizard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

export const dynamic = "force-dynamic";

export default async function AssetsDataImportPage() {
  await requireFeatureAndPermission("ASSETS", PERMISSIONS.ASSETS_CREATE, "/data-import");
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="space-y-2 border-b pb-5">
        <Link href="/assets" className="text-sm text-muted-foreground hover:text-foreground">
          Assets / Back to assets
        </Link>
        <h1 className="text-2xl font-semibold">Bulk Import Assets</h1>
        <p className="text-sm text-muted-foreground">
          Import assets from Excel or CSV, review validation and confirm results.
        </p>
      </header>
      <DataImportWizard initialEntityKey="UNIVERSAL_ASSETS" />
    </div>
  );
}
