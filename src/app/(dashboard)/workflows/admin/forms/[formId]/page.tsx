import { notFound, redirect } from "next/navigation";

import { prisma } from "@/infrastructure/database/prisma/client";
import { getCurrentUserId } from "@/lib/auth/session";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { FormBuilderClient } from "./form-builder-client";

export const dynamic = "force-dynamic";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_UPDATE);

  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: { id: formId },
    include: {
      workflowDefinition: {
        select: { id: true, name: true },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          publishedAt: true,
        },
      },
      publishedVersion: {
        select: { id: true, versionNumber: true, schemaJson: true },
      },
      _count: { select: { requests: true, versions: true } },
    },
  });

  if (!form) notFound();

  // Sibling forms — used as targets for REQUEST_LINK fields.
  const siblingForms = await prisma.form.findMany({
    where: {
      id: { not: form.id },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // All workflow definitions — for the inline workflow picker.
  const workflows = await prisma.workflowDefinition.findMany({
    select: {
      id: true,
      name: true,
      publishedVersion: { select: { versionNumber: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <FormBuilderClient
      form={form as never}
      siblingForms={siblingForms}
      workflows={workflows.map((w) => ({
        id: w.id,
        name: w.name,
        publishedVersionNumber: w.publishedVersion?.versionNumber ?? null,
      }))}
    />
  );
}
