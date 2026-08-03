/**
 * ROLE assignee resolver — resolves a role id to the set of user ids
 * that hold the role via the (single-tenant) `UserRole` join table.
 */

import { injectable } from "inversify";

import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx, IAssigneeResolver } from "@/core/repositories/workflow";

@injectable()
export class RoleAssigneeResolver implements IAssigneeResolver {
  readonly kind = "ROLE" as const;

  async resolve(
    spec: AssigneeSpec,
    exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    if (spec.kind !== "ROLE") return [];
    const rows = await exec.tx.userRole.findMany({
      where: { roleId: spec.roleId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }
}
