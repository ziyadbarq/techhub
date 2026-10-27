import Link from "next/link";

import { Badge, Card, LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

export default async function AdminWorkflowsListPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_DEFINITIONS_VIEW);

  const definitions = await prisma.workflowDefinition.findMany({
    include: {
      publishedVersion: { select: { versionNumber: true } },
      _count: { select: { versions: true, forms: true } },
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
          <h1 className="text-h2 mt-1">Workflows</h1>
          <p className="text-subtitle text-slate mt-1">
            {definitions.length} workflow
            {definitions.length === 1 ? "" : "s"}.
          </p>
        </div>
        <LinkButton href="/workflows/admin/workflows/new" variant="primary">
          New workflow
        </LinkButton>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Published</th>
                <th className="px-5 py-3">Versions</th>
                <th className="px-5 py-3">Forms</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="text-body-sm-medium text-ink px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      {d.name}
                      {d.isBuiltIn ? (
                        <Badge tone="neutral">Built-in</Badge>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {d.publishedVersion ? (
                      <Badge tone="success">
                        v{d.publishedVersion.versionNumber}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Draft only</Badge>
                    )}
                  </td>
                  <td className="text-body-sm text-slate px-5 py-3">
                    {d._count.versions}
                  </td>
                  <td className="text-body-sm text-slate px-5 py-3">
                    {d._count.forms}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/workflows/admin/workflows/${d.id}`}
                      className="text-body-sm-medium text-[var(--color-brand-blue)] hover:underline"
                    >
                      {d.isBuiltIn ? "View →" : "Edit →"}
                    </Link>
                  </td>
                </tr>
              ))}
              {definitions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-body-md text-stone px-5 py-12 text-center"
                  >
                    No workflows yet.
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
