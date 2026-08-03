import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;

  const req = await prisma.request.findUnique({
    where: { id },
    include: {
      form: { select: { id: true, name: true } },
      formVersion: {
        select: { id: true, versionNumber: true, schemaJson: true },
      },
      workflowVersion: {
        select: { id: true, versionNumber: true, graphJson: true },
      },
      requester: { select: { id: true, name: true, email: true } },
      holdReason: { select: { id: true, key: true, label: true } },
    },
  });

  if (!req) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const stepInstances = await prisma.stepInstance.findMany({
    where: { requestId: req.id },
    orderBy: { createdAt: "asc" },
    include: {
      snapshots: {
        select: {
          userId: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const fieldValues = await prisma.requestFieldValue.findMany({
    where: { requestId: req.id },
    select: { fieldKey: true, valueJson: true, updatedAt: true },
  });

  const valuesMap: Record<string, unknown> = {};
  for (const row of fieldValues) {
    const v = row.valueJson as { value?: unknown } | null;
    valuesMap[row.fieldKey] =
      v && typeof v === "object" && "value" in v ? v.value : v;
  }

  const activeStep = stepInstances.find((s) => s.status === "ACTIVE");
  const userIsAssignee =
    activeStep?.snapshots.some((s) => s.userId === userId) ?? false;

  return NextResponse.json({
    request: {
      id: req.id,
      referenceNumber: req.referenceNumber,
      status: req.status,
      outcome: req.outcome,
      holdReason: req.holdReason,
      createdAt: req.createdAt.toISOString(),
      submittedAt: req.submittedAt?.toISOString() ?? null,
      closedAt: req.closedAt?.toISOString() ?? null,
      currentStepInstanceId: req.currentStepInstanceId,
      form: req.form,
      requester: req.requester,
      formVersion: req.formVersion,
      workflowVersion: req.workflowVersion,
    },
    fieldValues: valuesMap,
    stepInstances: stepInstances.map((s) => ({
      id: s.id,
      stepKey: s.stepKey,
      status: s.status,
      activatedAt: s.activatedAt?.toISOString() ?? null,
      completedAt: s.completedAt?.toISOString() ?? null,
      assignees: s.snapshots.map((sn) => sn.user),
    })),
    permissions: {
      canActOnActiveStep: userIsAssignee,
      isRequester: req.requesterId === userId,
    },
  });
}
