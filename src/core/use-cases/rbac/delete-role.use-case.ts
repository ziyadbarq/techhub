/**
 * Delete Role Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { IAuditLogRepository } from "../../repositories/audit-log-repository.interface";
import {
  RoleNotFoundError,
  SystemRoleModificationError,
} from "../../domain/errors/rbac-errors";
import { invalidatePermissionCache } from "@/lib/permissions/cache";

export interface DeleteRoleRequest {
  roleId: string;
  deletedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class DeleteRoleUseCase {
  constructor(
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(request: DeleteRoleRequest): Promise<void> {
    // Find existing role
    const existingRole = await this.roleRepository.findById(request.roleId);
    if (!existingRole) {
      throw new RoleNotFoundError(request.roleId);
    }

    // Check if role can be deleted
    if (!existingRole.canBeDeleted()) {
      throw new SystemRoleModificationError(existingRole.name);
    }

    // Capture before state for audit
    const beforeState = existingRole.toObject();

    // Delete role
    await this.roleRepository.delete(request.roleId);

    // Log audit trail
    await this.auditLogRepository.create({
      userId: request.deletedBy,
      action: "role:delete",
      entityType: "role",
      entityId: request.roleId,
      changes: {
        before: beforeState,
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    // Removing a role changes effective permissions
    invalidatePermissionCache("all");
  }
}
