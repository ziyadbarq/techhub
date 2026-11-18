import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx, IAssigneeResolver } from "@/core/repositories/workflow";
import type { IAccessServiceSnapshotRepository } from "@/core/repositories/workflow/access-service.repository.interface";

/**
 * The people in one role (owner, cybersecurity, implementer…) of the access
 * service chosen on the request, as snapshotted at submit. Empty when the
 * service has nobody in that role.
 */
@injectable()
export class AccessServiceRoleAssigneeResolver implements IAssigneeResolver {
  readonly kind = "ACCESS_SERVICE_ROLE" as const;

  constructor(
    @inject(DI_TOKENS.IAccessServiceSnapshotRepository)
    private readonly snapshotRepo: IAccessServiceSnapshotRepository,
  ) {}

  async resolve(
    spec: AssigneeSpec,
    exec: ExecCtx & { requesterId: string },
  ): Promise<string[]> {
    if (spec.kind !== "ACCESS_SERVICE_ROLE") return [];

    const userIds = await this.snapshotRepo.findActiveAssigneeIdsByRole(
      exec.requestId,
      spec.serviceSnapshotKey,
      spec.role,
      exec.tx,
    );

    // Nobody in that role on the chosen service is not an error: the step
    // activates without assignees and waits for the form's owner or an
    // admin (the engine records it and tells the owners).
    return userIds;
  }
}
