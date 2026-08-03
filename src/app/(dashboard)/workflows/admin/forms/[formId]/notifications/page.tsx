import { notFound } from "next/navigation";

import { Badge, Card, LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { NotificationBindingsClient } from "./bindings-client";

export const dynamic = "force-dynamic";

export default async function FormNotificationsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_MANAGE_NOTIFICATIONS);

  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: { id: formId },
    select: { id: true, name: true, isBuiltIn: true },
  });
  if (!form) notFound();

  const [emailTemplates, roles] = await Promise.all([
    prisma.emailTemplate.findMany({
      select: { id: true, key: true, subject: true },
      orderBy: { key: "asc" },
    }),
    prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const bindings = await prisma.formNotificationBinding.findMany({
    where: { formId: form.id },
    include: { role: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <LinkButton
        href={`/workflows/admin/forms/${form.id}`}
        variant="ghost"
        size="sm"
      >
        ← Form
      </LinkButton>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-micro-uppercase text-stone">
            Form · Notifications
          </span>
          <h1 className="text-h2 mt-1 inline-flex items-center gap-3">
            {form.name}
            {form.isBuiltIn ? <Badge tone="neutral">Built-in</Badge> : null}
          </h1>
          <p className="text-subtitle text-slate mt-1">
            Bind email templates to events on this form. The notification
            dispatcher reads these bindings when an event fires.
          </p>
        </div>
      </header>

      {emailTemplates.length === 0 ? (
        <Card>
          <p className="text-body-sm text-charcoal">
            No email templates found. Create one in{" "}
            <LinkButton
              href="/workflows/admin/email-templates"
              variant="ghost"
              size="sm"
            >
              Email templates
            </LinkButton>{" "}
            first, then come back here to bind it to a form event.
          </p>
        </Card>
      ) : (
        <NotificationBindingsClient
          formId={form.id}
          isBuiltIn={form.isBuiltIn}
          initialBindings={bindings.map((b) => ({
            id: b.id,
            event: b.event,
            emailTemplateKey: b.emailTemplateKey,
            recipientKind: b.recipientKind,
            recipientRoleId: b.recipientRoleId,
            roleName: b.role?.name ?? null,
            isActive: b.isActive,
          }))}
          emailTemplates={emailTemplates.map((t) => ({
            key: t.key,
            subject: t.subject,
          }))}
          roles={roles}
        />
      )}
    </div>
  );
}
