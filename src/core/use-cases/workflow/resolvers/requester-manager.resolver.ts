/**
 * REQUESTER_MANAGER assignee resolver.
 *
 * Resolves to the requester's line manager by traversing the
 * `Person.managerId` chain:
 *   User.id (requester) → Person(userId=User.id) → Person(id=managerId) → userId
 *
 * Returns an empty array (no assignees) if:
 *  - the requester has no linked Person,
 *  - the requester's Person has no manager set,
 *  - or the manager Person has no linked User (e.g., synced from HR but
 *    hasn't logged in yet).
 *
 * The engine treats an empty assignee set as an activation failure and
 * surfaces a clear error to the caller, so misconfigured manager chains
 * never silently dead-end a workflow.
 */

import { injectable } from "inversify";

import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx, IAssigneeResolver } from "@/core/repositories/workflow";

@injectable()
export class RequesterManagerAssigneeResolver implements IAssigneeResolver {
  readonly kind = "REQUESTER_MANAGER" as const;

  async resolve(
    _spec: AssigneeSpec,
    exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    const requesterPerson = await exec.tx.person.findFirst({
      where: { userId: exec.requesterId, isActive: true },
      select: { managerId: true },
    });
    if (!requesterPerson?.managerId) return [];

    const manager = await exec.tx.person.findUnique({
      where: { id: requesterPerson.managerId },
      select: { userId: true, isActive: true },
    });
    if (!manager?.userId || !manager.isActive) return [];

    return [manager.userId];
  }
}
