/**
 * Which requests a user may list on /workflows/requests.
 *
 * - "all"      — every request; only with `workflows-requests:view`.
 * - "mine"     — requests the user submitted.
 * - "assigned" — requests with a step the user was assigned to, finished or
 *   not: an approver can find a request again after acting on it. The same
 *   rule that lets them open it (`assigneeSnapshot`).
 *
 * A user without the global view permission never gets "all", whatever the
 * URL or a saved filter says: they fall back to "mine".
 */

export const REQUEST_LIST_SCOPES = ["all", "mine", "assigned"] as const;
export type RequestListScope = (typeof REQUEST_LIST_SCOPES)[number];

export function resolveRequestListScope(
  requested: string | undefined | null,
  canViewAll: boolean,
): RequestListScope {
  if (requested === "mine" || requested === "assigned") return requested;
  if (requested === "all") return canViewAll ? "all" : "mine";
  return canViewAll ? "all" : "mine";
}

/** The Prisma `where` that limits a request list to the scope. */
export function requestListScopeWhere(scope: RequestListScope, userId: string) {
  switch (scope) {
    case "mine":
      return { requesterId: userId };
    case "assigned":
      return {
        stepInstances: { some: { snapshots: { some: { userId } } } },
      };
    case "all":
      return {};
  }
}
