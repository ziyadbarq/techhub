import Link from "next/link";

import { Badge, Card, LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const TONES = ["yellow", "rose", "coral", "teal", "orange"] as const;

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
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <span className="text-micro-uppercase text-stone">
          Submit a request
        </span>
        <h1 className="text-h1">Pick a form to start.</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Each form is a request type. Select one to fill it out, route it
          through its workflow, and track the outcome.
        </p>
      </header>

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
          {forms.map((f, i) => {
            const tone = TONES[i % TONES.length];
            return (
              <Link key={f.id} href={`/workflows/requests/new/${f.id}`}>
                <Card tone={tone} size="feature" className="h-full">
                  <div className="flex h-full flex-col">
                    <span className="text-micro-uppercase text-charcoal/70">
                      Form
                    </span>
                    <h2 className="text-h3 mt-3">{f.name}</h2>
                    {f.description ? (
                      <p className="text-body-sm text-charcoal/80 mt-2">
                        {f.description}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between pt-6">
                      {f.publishedVersionId ? (
                        <Badge tone="success">Published</Badge>
                      ) : (
                        <Badge tone="neutral">Draft only</Badge>
                      )}
                      <span className="text-body-sm-medium text-ink">
                        Start →
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div>
        <LinkButton href="/dashboard" variant="ghost" size="sm">
          ← Back to overview
        </LinkButton>
      </div>
    </div>
  );
}
