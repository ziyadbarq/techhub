import Link from "next/link";
import { redirect } from "next/navigation";

import { AnimatedCount, Badge, Card } from "@/components/design";
import { AutoRefresh } from "@/components/workflows/auto-refresh";
import { prisma } from "@/infrastructure/database/prisma/client";
import { getCurrentUserId } from "@/lib/auth/session";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { NotificationsActions } from "./notifications-actions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_NOTIFICATIONS_VIEW);

  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      request: {
        select: {
          id: true,
          referenceNumber: true,
          form: { select: { name: true } },
        },
      },
    },
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={20_000} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-micro-uppercase text-stone">Notifications</span>
          <h1 className="text-h2 mt-1">
            {unreadCount > 0 ? (
              <>
                <AnimatedCount value={unreadCount} /> unread
              </>
            ) : (
              "All caught up."
            )}
          </h1>
        </div>
        {unreadCount > 0 ? <NotificationsActions /> : null}
      </header>

      {notifications.length === 0 ? (
        <Card>
          <p className="text-body-md text-slate">No notifications yet.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n.id}>
              <Card
                tone={n.readAt ? "white" : "lavender"}
                bordered={!!n.readAt}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-h5 text-ink">{n.subject}</p>
                    <p className="text-body-sm text-slate mt-1">{n.body}</p>
                    {n.request ? (
                      <p className="text-caption text-stone mt-3">
                        <Link
                          className="text-charcoal font-mono hover:underline"
                          href={`/workflows/requests/${n.request.id}`}
                        >
                          {n.request.referenceNumber}
                        </Link>{" "}
                        · {n.request.form.name}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge tone={n.channel === "EMAIL" ? "yellow" : "purple"}>
                      {n.channel}
                    </Badge>
                    <span className="text-caption text-stone">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
