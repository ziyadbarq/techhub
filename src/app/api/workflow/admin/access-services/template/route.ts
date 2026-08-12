import { NextResponse } from "next/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export const dynamic = "force-dynamic";

const CSV_TEMPLATE =
  "name,slug,description,requireManagerApproval,instructions,ownerEmails,cybersecurityEmails,implementerEmails\r\n" +
  '"IT VPN Access","it-vpn-access","Provides VPN access for remote work",true,"Submit request via IT portal","alice@example.com;bob@example.com","charlie@example.com","dave@example.com"\r\n';

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_VIEW);

  return new NextResponse(CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="access-services-template.csv"',
    },
  });
}
