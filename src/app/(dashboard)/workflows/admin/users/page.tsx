import { Card, LinkButton } from "@/components/design";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { formatDate } from "@/lib/utils/date-format";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

import { RolesEditor } from "./roles-editor";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_VIEW);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      roles: { select: { role: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const allRoles = await prisma.role.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const userIds = users.map((m) => m.id);

  const [activeAssignments, openRequests, delegationsFrom, delegationsTo] =
    await Promise.all([
      prisma.assigneeSnapshot.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          stepInstance: { status: "ACTIVE" },
        },
        _count: { _all: true },
      }),
      prisma.request.groupBy({
        by: ["requesterId"],
        where: {
          requesterId: { in: userIds },
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
        _count: { _all: true },
      }),
      prisma.delegation.groupBy({
        by: ["fromUserId"],
        where: { fromUserId: { in: userIds }, isActive: true },
        _count: { _all: true },
      }),
      prisma.delegation.groupBy({
        by: ["toUserId"],
        where: { toUserId: { in: userIds }, isActive: true },
        _count: { _all: true },
      }),
    ]);

  const assignmentCount = new Map(
    activeAssignments.map((g) => [g.userId, g._count._all]),
  );
  const openCount = new Map(
    openRequests.map((g) => [g.requesterId, g._count._all]),
  );
  const delegFromCount = new Map(
    delegationsFrom.map((g) => [g.fromUserId, g._count._all]),
  );
  const delegToCount = new Map(
    delegationsTo.map((g) => [g.toUserId, g._count._all]),
  );

  return (
    <div className="space-y-6">
      <LinkButton href="/workflows/admin" variant="ghost" size="sm">
        ← Admin
      </LinkButton>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-micro-uppercase text-stone">Admin · Users</span>
          <h1 className="text-h2 mt-1">Workflow users</h1>
          <p className="text-subtitle text-slate mt-1">
            {users.length} user{users.length === 1 ? "" : "s"} in this
            organisation.
          </p>
        </div>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Roles</th>
                <th className="px-5 py-3">Open requests</th>
                <th className="px-5 py-3">Active assignments</th>
                <th className="px-5 py-3">Delegations</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((m) => {
                const initial = (m.name || m.email).slice(0, 1).toUpperCase();
                const dlgFrom = delegFromCount.get(m.id) ?? 0;
                const dlgTo = delegToCount.get(m.id) ?? 0;
                return (
                  <tr
                    key={m.id}
                    className="border-b border-[var(--color-hairline-soft)] last:border-0"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="text-body-sm-medium text-ink flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "var(--color-yellow-light)" }}
                        >
                          {initial}
                        </span>
                        <div className="min-w-0">
                          <p className="text-body-sm-medium text-ink truncate">
                            {m.name || "(no name)"}
                          </p>
                          <p className="text-caption text-stone truncate">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <RolesEditor
                        userId={m.id}
                        initialRoleIds={m.roles.map((r) => r.role.id)}
                        allRoles={allRoles}
                        readOnly
                      />
                    </td>
                    <td className="text-body-sm text-charcoal px-5 py-3">
                      {openCount.get(m.id) ?? 0}
                    </td>
                    <td className="text-body-sm text-charcoal px-5 py-3">
                      {assignmentCount.get(m.id) ?? 0}
                    </td>
                    <td className="text-body-sm text-slate px-5 py-3">
                      {dlgFrom + dlgTo === 0 ? (
                        <span className="text-stone">—</span>
                      ) : (
                        <span className="text-caption">
                          {dlgFrom > 0 ? `from ${dlgFrom}` : null}
                          {dlgFrom > 0 && dlgTo > 0 ? " · " : null}
                          {dlgTo > 0 ? `to ${dlgTo}` : null}
                        </span>
                      )}
                    </td>
                    <td className="text-body-sm text-stone px-5 py-3">
                      {formatDate(m.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-body-md text-stone px-5 py-12 text-center"
                  >
                    No users yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-caption text-stone">
        Role assignments are managed in the global RBAC admin area.
      </p>
    </div>
  );
}
