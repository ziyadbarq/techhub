import Link from "next/link";
import { redirect } from "next/navigation";

import { AnimatedCount, Badge, Card, LinkButton } from "@/components/design";
import { AutoRefresh } from "@/components/workflows/auto-refresh";
import { InboxQuickActions } from "@/components/workflows/inbox-quick-actions";
import { prisma } from "@/infrastructure/database/prisma/client";
import { getCurrentUserId } from "@/lib/auth/session";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_INBOX_VIEW);

  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const steps = await prisma.stepInstance.findMany({
    where: {
      status: "ACTIVE",
      snapshots: { some: { userId } },
    },
    include: {
      request: {
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          createdAt: true,
          submittedAt: true,
          form: { select: { name: true } },
          requester: { select: { name: true, email: true } },
        },
      },
      workflowVersion: { select: { graphJson: true } },
    },
    orderBy: { activatedAt: "desc" },
  });

  // Resolve each step's type from the workflow graph so the quick-action
  // panel knows which buttons to surface.
  const stepTypeByInstance = new Map<string, string>();
  for (const s of steps) {
    const graph = s.workflowVersion.graphJson as
      | { steps?: Array<{ key: string; type: string }> }
      | null;
    const def = graph?.steps?.find((g) => g.key === s.stepKey);
    stepTypeByInstance.set(s.id, def?.type ?? "");
  }

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={15_000} />
      <header className="flex flex-col gap-3">
        <span className="text-micro-uppercase text-stone">Inbox</span>
        <h1 className="text-h2">
          {steps.length === 0 ? (
            "All caught up."
          ) : (
            <>
              <AnimatedCount value={steps.length} /> request
              {steps.length === 1 ? "" : "s"} need your action.
            </>
          )}
        </h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Active steps where you appear in the assignee snapshot. Click any
          request to take an action.
        </p>
      </header>

      {steps.length === 0 ? (
        <Card tone="teal" size="feature">
          <h3 className="text-h4">Nothing waiting on you.</h3>
          <p className="mt-2 text-body-md text-charcoal/80">
            New steps will appear here as soon as they&apos;re assigned to you.
          </p>
          <div className="mt-5">
            <LinkButton href="/workflows/forms" variant="primary">
              Submit a request
            </LinkButton>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {steps.map((s) => {
            const stepType = stepTypeByInstance.get(s.id) ?? "";
            return (
              <Card
                key={s.id}
                className="transition-shadow hover:shadow-[var(--shadow-2)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <Link
                    href={`/workflows/requests/${s.request.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="text-caption font-mono text-stone">
                      {s.request.referenceNumber}
                    </p>
                    <h3 className="mt-1 text-h5 text-ink hover:underline">
                      {s.request.form.name}
                    </h3>
                    <p className="mt-1 text-body-sm text-slate">
                      Step{" "}
                      <span className="font-mono text-charcoal">
                        {s.stepKey}
                      </span>
                      {s.activatedAt
                        ? ` · activated ${new Date(s.activatedAt).toLocaleString()}`
                        : null}
                    </p>
                    <p className="mt-1 text-caption text-stone">
                      Requester:{" "}
                      <span className="text-charcoal">
                        {s.request.requester.name || s.request.requester.email}
                      </span>
                    </p>
                  </Link>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge tone="purple">Action needed</Badge>
                    <InboxQuickActions
                      stepInstanceId={s.id}
                      stepType={stepType}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
