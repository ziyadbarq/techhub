import { inject, injectable } from "inversify";
import { ConfigurationError } from "@/core/domain/workflow";
import { DI_TOKENS } from "@/di/types";
import type { AssigneeSpec } from "@/core/domain/workflow";
import type { ExecCtx, IAssigneeResolver } from "@/core/repositories/workflow";
import type { IAccessServiceSnapshotRepository } from "@/core/repositories/workflow/access-service.repository.interface";

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

    if (userIds.length === 0) {
      throw new ConfigurationError(
        `Step requires ${spec.role} role from access service field "${spec.serviceSnapshotKey}" ` +
          `but no active users are snapshotted for request "${exec.requestId}". ` +
          `Ensure the service catalog has at least one active user in this role.`,
      );
    }

    return userIds;
  }
}
