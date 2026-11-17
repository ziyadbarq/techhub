import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";
import type { ResolvePeopleByNameUseCase } from "@/core/use-cases/user-provisioning";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  names: z.array(z.string().trim().min(1).max(200)).min(1).max(100), // MAX_NAMES_PER_LOOKUP,
});

/**
 * Resolve Active Directory display names to user accounts, creating an
 * account for a matched person who has none yet. Used when a workflow is
 * set up for named approvers (e.g. by the request-forms console script).
 */
export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_UPDATE);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const people = await getContainer()
    .get<ResolvePeopleByNameUseCase>(DI_TOKENS.ResolvePeopleByNameUseCase)
    .execute({
      names: parsed.data.names,
      requestedBy: await getCurrentUserId(),
    });
  return NextResponse.json({ people });
}
