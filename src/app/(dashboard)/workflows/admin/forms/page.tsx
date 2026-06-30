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
      workflowDefinition: { select: { id: true, name: true } },
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
          <span className="text-micro-uppercase text-stone">
            Admin · Forms
          </span>
          <h1 className="mt-1 text-h2">Forms</h1>
          <p className="mt-1 text-subtitle text-slate">
            {forms.length} form{forms.length === 1 ? "" : "s"} in this
            organization.
          </p>
        </div>
        <LinkButton href="/workflows/admin/forms/new" variant="primary">
          New form
        </LinkButton>
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Workflow</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3">Published</th>
                <th className="px-5 py-3">Versions</th>
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
                  <td className="px-5 py-3 text-body-sm-medium text-ink">
                    <span className="inline-flex items-center gap-2">
                      {f.name}
                      {f.isBuiltIn ? (
                        <Badge tone="neutral">Built-in</Badge>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-body-sm text-slate">
                    {f.workflowDefinition.name}
                  </td>
                  <td className="px-5 py-3">
                    {f.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-caption text-charcoal">
                    {f.publishedVersion
                      ? `v${f.publishedVersion.versionNumber}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-body-sm text-slate">
                    {f._count.versions}
                  </td>
                  <td className="px-5 py-3 text-body-sm text-slate">
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
                    colSpan={7}
                    className="px-5 py-12 text-center text-body-md text-stone"
                  >
                    No forms yet. Create one to get started.
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
