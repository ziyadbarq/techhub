import { notFound } from "next/navigation";

import { Badge, LinkButton } from "@/components/design";
import type { PersonOption } from "@/components/workflows/people-picker";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import type { FormMemberRole } from "@/core/domain/workflow";

import { FormPeopleClient } from "./form-people-client";

export const dynamic = "force-dynamic";

export default async function FormPeoplePage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_UPDATE);

  const { formId } = await params;
  const form = await prisma.form.findFirst({
    where: { id: formId },
    select: { id: true, name: true, isBuiltIn: true },
  });
  if (!form) notFound();

  const [people, members] = await Promise.all([
    prisma.person.findMany({
      where: { isActive: true, isExcluded: false },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.formMember.findMany({
      where: { formId: form.id },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const options: PersonOption[] = people.map((p) => ({
    id: p.userId ?? `person:${p.id}`,
    personId: p.id,
    userId: p.userId,
    name: `${p.firstName} ${p.lastName}`.trim(),
    email: p.email,
  }));
  const byId = new Map(options.map((o) => [o.id, o]));

  // A member who isn't in Persons (a local account) is still listed.
  const current: Record<FormMemberRole, PersonOption[]> = {
    OWNER: [],
    MANAGER: [],
    VIEWER: [],
  };
  for (const m of members) {
    const option = byId.get(m.user.id) ?? {
      id: m.user.id,
      personId: null,
      userId: m.user.id,
      name: m.user.name?.trim() || m.user.email,
      email: m.user.email,
    };
    if (!byId.has(option.id)) {
      byId.set(option.id, option);
      options.push(option);
    }
    current[m.role].push(option);
  }

  return (
    <div className="space-y-6">
      <LinkButton
        href={`/workflows/admin/forms/${form.id}`}
        variant="ghost"
        size="sm"
      >
        ← Form
      </LinkButton>

      <header>
        <h1 className="text-h2 mt-1 flex flex-wrap items-center gap-3">
          {form.name}
          {form.isBuiltIn ? <Badge tone="neutral">Built-in</Badge> : null}
        </h1>
        <p className="text-subtitle text-slate mt-2 max-w-2xl">
          People with a role on every request of this form, besides the
          approvers in its workflow. An owner can also do what a manager and a
          viewer can; a manager can also do what a viewer can.
        </p>
      </header>

      <FormPeopleClient formId={form.id} people={options} initial={current} />
    </div>
  );
}
