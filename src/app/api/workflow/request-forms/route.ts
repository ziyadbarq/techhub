import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

/**
 * Sidebar submission catalog. This is intentionally different from the admin
 * forms endpoint, which needs FORMS_VIEW and may include unpublished drafts.
 */
export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT);

  const forms = await prisma.form.findMany({
    where: {
      isActive: true,
      publishedVersionId: { not: null },
    },
    select: { id: true, name: true, description: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  return NextResponse.json(
    { forms },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
