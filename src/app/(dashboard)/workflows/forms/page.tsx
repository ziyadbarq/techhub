import Link from "next/link";

import { ArrowUpRight, ChevronRight, FileText } from "lucide-react";

import { Badge, Card } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

export default async function WorkflowFormsPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT);

  const forms = await prisma.form.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      publishedVersionId: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-h1">Browse Forms</h1>
          <p className="text-subtitle text-slate max-w-2xl">
            Pick a request type to fill it out and send it for approval.
          </p>
        </header>
        <Link href="/request" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-hairline-soft)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface-soft)]">
          Open request portal <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {forms.length === 0 ? (
        <Card>
          <p className="text-body-md text-slate">
            No active forms yet. Run{" "}
            <span className="text-ink font-mono">
              SEED_DEMO=1 npm run prisma:seed
            </span>{" "}
            to load the demo workflow, or create one from the admin area.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {forms.map((f) => (
            <Link
              key={f.id}
              href={`/workflows/requests/new/${f.id}`}
              className="group bg-card hover:bg-muted/40 flex h-full flex-col rounded-xl border p-5 shadow-sm transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="bg-muted grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold">{f.name}</h2>
                  {f.description ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {f.description}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between pt-5">
                {f.publishedVersionId ? (
                  <Badge tone="success">Published</Badge>
                ) : (
                  <Badge tone="neutral">Draft only</Badge>
                )}
                <span className="flex items-center gap-1 text-sm font-medium">
                  Start
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
