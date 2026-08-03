/**
 * REQUESTER assignee resolver — resolves to the user who submitted
 * the request (carried on the exec context).
 */

import { injectable } from "inversify";

import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx, IAssigneeResolver } from "@/core/repositories/workflow";

@injectable()
export class RequesterAssigneeResolver implements IAssigneeResolver {
  readonly kind = "REQUESTER" as const;

  async resolve(
    _spec: AssigneeSpec,
    exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    return [exec.requesterId];
  }
}
