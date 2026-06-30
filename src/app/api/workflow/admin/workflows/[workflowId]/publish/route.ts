import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ workflowId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_PUBLISH);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { workflowId } = await context.params;

  const def = await prisma.workflowDefinition.findUnique({
    where: { id: workflowId },
    select: { id: true, publishedVersionId: true, isBuiltIn: true },
  });
  if (!def) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (def.isBuiltIn) {
    return NextResponse.json(
      {
        error: "BUILT_IN_READ_ONLY",
        message: "Built-in workflows cannot be modified.",
      },
      { status: 403 },
    );
  }

  const draft = await prisma.workflowVersion.findFirst({
    where: { workflowDefinitionId: workflowId, status: "DRAFT" },
    orderBy: { versionNumber: "desc" },
  });
  if (!draft) return NextResponse.json({ error: "NO_DRAFT" }, { status: 409 });

  const graph = draft.graphJson as {
    start?: string;
    steps?: Array<{
      key: string;
      next?: { default?: string; onAction?: Record<string, string> };
    }>;
  };
  if (!graph.start || !graph.steps || graph.steps.length === 0) {
    return NextResponse.json(
      {
        error: "EMPTY_WORKFLOW",
        message: "Workflow must have a start step and at least one step",
      },
      { status: 400 },
    );
  }
  const stepKeys = new Set(graph.steps.map((s) => s.key));
  if (!stepKeys.has(graph.start)) {
    return NextResponse.json(
      {
        error: "INVALID_START",
        message: `Start step "${graph.start}" not found in steps`,
      },
      { status: 400 },
    );
  }
  // Validate routing targets
  for (const step of graph.steps) {
    const next = step.next;
    if (!next) continue;
    if ("default" in next && next.default && !stepKeys.has(next.default)) {
      return NextResponse.json(
        {
          error: "INVALID_ROUTING",
          message: `Step "${step.key}" routes to unknown step "${next.default}"`,
        },
        { status: 400 },
      );
    }
    if ("onAction" in next && next.onAction) {
      for (const [action, target] of Object.entries(next.onAction)) {
        if (!stepKeys.has(target)) {
          return NextResponse.json(
            {
              error: "INVALID_ROUTING",
              message: `Step "${step.key}" routes ${action} to unknown step "${target}"`,
            },
            { status: 400 },
          );
        }
      }
    }
  }

  const result2 = await prisma.$transaction(async (tx) => {
    if (def.publishedVersionId) {
      await tx.workflowVersion.update({
        where: { id: def.publishedVersionId },
        data: { status: "ARCHIVED" },
      });
    }
    const published = await tx.workflowVersion.update({
      where: { id: draft.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedById: userId,
      },
    });
    await tx.workflowDefinition.update({
      where: { id: workflowId },
      data: { publishedVersionId: published.id },
    });
    // Materialize WorkflowStep rows
    const steps =
      (
        published.graphJson as {
          steps?: Array<{
            key: string;
            type: string;
            position: number;
            config?: object;
          }>;
        }
      ).steps ?? [];
    for (const s of steps) {
      const cfg = s.config
        ? (s.config as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull;
      await tx.workflowStep.upsert({
        where: {
          workflowVersionId_key: { workflowVersionId: published.id, key: s.key },
        },
        update: { type: s.type as never, position: s.position, config: cfg },
        create: {
          workflowVersionId: published.id,
          key: s.key,
          type: s.type as never,
          position: s.position,
          config: cfg,
        },
      });
    }
    return published;
  });

  return NextResponse.json({ published: result2 });
}
