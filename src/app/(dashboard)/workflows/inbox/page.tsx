import { Inbox as InboxIcon } from "lucide-react";
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
    const graph = s.workflowVersion.graphJson as {
      steps?: Array<{ key: string; type: string }>;
    } | null;
    const def = graph?.steps?.find((g) => g.key === s.stepKey);
    stepTypeByInstance.set(s.id, def?.type ?? "");
  }

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={15_000} />
      <header className="space-y-1">
        <h1 className="text-h2">Inbox</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          {steps.length === 0 ? (
            "Nothing is waiting on you."
          ) : (
            <>
              <AnimatedCount value={steps.length} /> request
              {steps.length === 1 ? "" : "s"} waiting for your action.
            </>
          )}
        </p>
      </header>

      {steps.length === 0 ? (
        <div className="bg-card flex flex-col items-center rounded-xl border px-6 py-12 text-center shadow-sm">
          <div className="bg-muted grid h-12 w-12 place-items-center rounded-full">
            <InboxIcon className="text-muted-foreground h-6 w-6" />
          </div>
          <h3 className="mt-4 font-semibold">No pending approvals</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Steps assigned to you will appear here.
          </p>
          <div className="mt-5">
            <LinkButton href="/workflows/forms" variant="primary" size="sm">
              Submit a request
            </LinkButton>
          </div>
        </div>
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
                    <p className="text-caption text-stone font-mono">
                      {s.request.referenceNumber}
                    </p>
                    <h3 className="text-h5 text-ink mt-1 hover:underline">
                      {s.request.form.name}
                    </h3>
                    <p className="text-body-sm text-slate mt-1">
                      Step{" "}
                      <span className="text-charcoal font-mono">
                        {s.stepKey}
                      </span>
                      {s.activatedAt
                        ? ` · activated ${new Date(s.activatedAt).toLocaleString()}`
                        : null}
                    </p>
                    <p className="text-caption text-stone mt-1">
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
