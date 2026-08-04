import { notFound } from "next/navigation";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { WorkflowBuilderClient } from "./workflow-builder-client";

export const dynamic = "force-dynamic";

export default async function EditWorkflowPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_UPDATE);

  const { workflowId } = await params;

  const def = await prisma.workflowDefinition.findFirst({
    where: { id: workflowId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          publishedAt: true,
        },
      },
      forms: { select: { id: true, name: true } },
      publishedVersion: { select: { versionNumber: true } },
    },
  });
  if (!def) notFound();

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const linkedForms = def.forms.map((f) => ({ id: f.id, name: f.name }));

  return (
    <WorkflowBuilderClient
      definition={{
        id: def.id,
        name: def.name,
        description: def.description,
        publishedVersionNumber: def.publishedVersion?.versionNumber ?? null,
        formCount: def.forms.length,
      }}
      users={users}
      roles={roles}
      linkedForms={linkedForms}
    />
  );
}
