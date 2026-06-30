/**
 * REQUESTER_MANAGER assignee resolver — STUB.
 *
 * Resolves to the manager of the requester (their HR/management chain).
 * Not yet implemented: requires HR manager-chain integration. This stub
 * throws so misconfigured workflows surface the missing integration
 * loudly at activation time rather than silently dropping assignees.
 */

import { injectable } from "inversify";

import { NotImplementedError } from "@/core/domain/workflow";
import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx, IAssigneeResolver } from "@/core/repositories/workflow";

@injectable()
export class RequesterManagerAssigneeResolver implements IAssigneeResolver {
  readonly kind = "REQUESTER_MANAGER" as const;

  async resolve(
    _spec: AssigneeSpec,
    _exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    throw new NotImplementedError(
      "REQUESTER_MANAGER assignee resolver — requires HR manager-chain integration",
    );
  }
}
