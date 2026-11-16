import Link from "next/link";

import { Badge, Card, LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

export default async function AdminFormsListPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_VIEW);

  const forms = await prisma.form.findMany({
    include: {
      workflowDefinition: {
        select: { id: true, name: true, publishedVersionId: true },
      },
      publishedVersion: { select: { id: true, versionNumber: true } },
      _count: { select: { versions: true, requests: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h2 mt-1">Forms</h1>
          <p className="text-subtitle text-slate mt-1">
            Request types employees can submit. {forms.length} in total.
          </p>
        </div>
        <LinkButton href="/workflows/admin/forms/new" variant="primary">
          New request type
        </LinkButton>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Approval path</th>
                <th className="px-5 py-3">Live version</th>
                <th className="px-5 py-3">Requests</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="text-body-sm-medium text-ink px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      {f.name}
                      {f.isBuiltIn ? (
                        <Badge tone="neutral">Built-in</Badge>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {/* One status that answers "can employees submit it?" */}
                    {!f.isActive ? (
                      <Badge tone="neutral">Switched off</Badge>
                    ) : !f.publishedVersion ? (
                      <Badge tone="neutral">Draft</Badge>
                    ) : !f.workflowDefinition.publishedVersionId ? (
                      <Badge tone="yellow">Path not published</Badge>
                    ) : (
                      <Badge tone="success">Live</Badge>
                    )}
                  </td>
                  <td className="text-body-sm text-slate px-5 py-3">
                    <Link
                      href={`/workflows/designer/${f.workflowDefinition.id}`}
                      className="hover:text-ink hover:underline"
                    >
                      {f.workflowDefinition.name}
                    </Link>
                  </td>
                  <td className="text-caption text-charcoal px-5 py-3 font-mono">
                    {f.publishedVersion
                      ? `v${f.publishedVersion.versionNumber}`
                      : "—"}
                  </td>
                  <td className="text-body-sm text-slate px-5 py-3">
                    {f._count.requests}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/workflows/admin/forms/${f.id}`}
                      className="text-body-sm-medium text-[var(--color-brand-blue)] hover:underline"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
              {forms.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-body-md text-stone px-5 py-12 text-center"
                  >
                    No request types yet. Create one to get started.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
