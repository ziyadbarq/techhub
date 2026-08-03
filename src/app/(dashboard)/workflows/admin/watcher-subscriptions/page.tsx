import { LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { WatcherSubscriptionsClient } from "./watcher-subscriptions-client";

export const dynamic = "force-dynamic";

export default async function WatcherSubscriptionsPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_WATCHERS_MANAGE);

  const [subs, forms, roles] = await Promise.all([
    prisma.watcherSubscription.findMany({
      include: {
        form: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.form.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>
      <header className="space-y-2">
        <span className="text-micro-uppercase text-stone">
          Admin · Watcher subscriptions
        </span>
        <h1 className="text-h2">Watcher subscriptions</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Auto-add every member of a role as a watcher on every request
          submitted through a given form.
        </p>
      </header>
      <WatcherSubscriptionsClient
        initial={subs.map((s) => ({
          id: s.id,
          form: s.form,
          role: s.role,
        }))}
        forms={forms}
        roles={roles}
      />
    </div>
  );
}
