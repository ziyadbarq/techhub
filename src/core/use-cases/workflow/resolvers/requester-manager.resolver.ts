/**
 * REQUESTER_MANAGER assignee resolver.
 *
 * Resolves from OrganizationUnit.managerId (the organization chart source of
 * truth), with Person.managerId retained as a legacy fallback.
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
      select: {
        managerId: true,
        orgUnit: { select: { managerId: true } },
      },
    });
    const managerId =
      requesterPerson?.orgUnit.managerId ?? requesterPerson?.managerId;
    if (!managerId) return [];

    const manager = await exec.tx.person.findUnique({
      where: { id: managerId },
      select: { userId: true, isActive: true },
    });
    if (!manager?.userId || !manager.isActive) return [];

    return [manager.userId];
  }
}
