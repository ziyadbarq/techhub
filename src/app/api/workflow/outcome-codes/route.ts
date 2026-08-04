import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

/**
 * Public GET — used by the close/cancel dialog to populate the outcome-code
 * picker. Filtered to active codes; optionally narrowed to a given form.
 */
export async function GET(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW);

  const url = new URL(request.url);
  const formId = url.searchParams.get("formId");
  const generic = url.searchParams.get("generic"); // optional: filter by mapped generic outcome

  const codes = await prisma.outcomeCode.findMany({
    where: {
      isActive: true,
      ...(formId ? { OR: [{ formId }, { formId: null }] } : { formId: null }),
      ...(generic ? { genericOutcome: generic as never } : {}),
    },
    orderBy: [{ formId: "desc" }, { key: "asc" }],
  });
  return NextResponse.json({ codes });
}
