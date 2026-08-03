import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { EmailTemplatesClient } from "./email-templates-client";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_EMAIL_TEMPLATES_MANAGE);

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>
      <header className="space-y-2">
        <span className="text-micro-uppercase text-stone">
          Admin · Email templates
        </span>
        <h1 className="text-h2">Email templates</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Subject + HTML body used by the notification dispatcher. Reference
          dynamic variables like{" "}
          <code className="font-mono">{`{{request_id}}`}</code> in the body.
        </p>
      </header>
      <EmailTemplatesClient
        initial={templates.map((t) => ({
          id: t.id,
          key: t.key,
          subject: t.subject,
          bodyHtml: t.bodyHtml,
          bodyText: t.bodyText,
        }))}
      />
    </div>
  );
}
