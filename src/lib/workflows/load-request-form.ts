import { notFound, redirect } from "next/navigation";

import { prisma } from "@/infrastructure/database/prisma/client";
import { getCurrentUserId } from "@/lib/auth/session";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { lineManagerPersonId } from "@/core/domain/workflow/line-manager";
import { prepareRequesterLineManager } from "./prepare-line-manager";
import { requirePermission } from "@/lib/permissions/server";

/** Shared, permission-checked data source for dashboard and standalone submissions. */
export async function loadRequestFormData(formId: string) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT);

  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      isActive: true,
      // Same rule as Browse forms: no published approval path, no submission.
      workflowDefinition: { publishedVersionId: { not: null } },
    },
    include: {
      publishedVersion: { select: { schemaJson: true, versionNumber: true } },
    },
  });

  if (!form || !form.publishedVersion) notFound();

  const orgUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  // Resolve REQUEST_LINK fields' targetFormName → targetFormId so the
  // client picker can fetch candidates.
  const schema = form.publishedVersion.schemaJson as {
    fields?: Array<{
      type: string;
      key: string;
      config?: Record<string, unknown>;
    }>;
  };
  const linkFieldNames = new Set<string>();
  for (const f of schema.fields ?? []) {
    if (f.type === "REQUEST_LINK") {
      const targetName = f.config?.targetFormName as string | undefined;
      if (targetName) linkFieldNames.add(targetName);
    }
  }
  const linkedForms =
    linkFieldNames.size > 0
      ? await prisma.form.findMany({
          where: {
            name: { in: Array.from(linkFieldNames) },
          },
          select: { id: true, name: true },
        })
      : [];
  const formNameToId: Record<string, string> = {};
  for (const f of linkedForms) formNameToId[f.name] = f.id;

  // Link the line manager from Active Directory if it isn't yet.
  await prepareRequesterLineManager(userId, { ensureAccount: false });

  // Resolve SYSTEM_FIELD values from requester's Person record
  const person = await prisma.person.findFirst({
    where: { userId, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      managerId: true,
      orgUnit: { select: { managerId: true } },
    },
  });
  const systemFieldValues: Record<string, string> = {};
  if (person) {
    systemFieldValues["REQUESTER_NAME"] =
      `${person.firstName} ${person.lastName}`.trim();
    systemFieldValues["REQUESTER_EMAIL"] = person.email;
    const managerPersonId = lineManagerPersonId({
      id: person.id,
      managerId: person.managerId,
      orgUnitManagerId: person.orgUnit.managerId,
    });
    if (managerPersonId) {
      const manager = await prisma.person.findUnique({
        where: { id: managerPersonId },
        select: { firstName: true, lastName: true },
      });
      if (manager) {
        systemFieldValues["REQUESTER_MANAGER_NAME"] =
          `${manager.firstName} ${manager.lastName}`.trim();
      }
    }
  }

  return { form, orgUsers, formNameToId, systemFieldValues };
}
