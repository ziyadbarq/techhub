/**
 * USER assignee resolver — resolves an `{ kind: "USER", userId }` spec
 * to the literal user id.
 */

import { injectable } from "inversify";

import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx, IAssigneeResolver } from "@/core/repositories/workflow";

@injectable()
export class UserAssigneeResolver implements IAssigneeResolver {
  readonly kind = "USER" as const;

  async resolve(
    spec: AssigneeSpec,
    _exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    if (spec.kind !== "USER") return [];
    return [spec.userId];
  }
}
