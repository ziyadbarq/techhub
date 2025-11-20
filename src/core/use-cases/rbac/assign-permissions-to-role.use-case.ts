/**
 * Assign Permissions to Role Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { IPermissionRepository } from "../../repositories/permission-repository.interface";
import type { IAuditLogRepository } from "../../repositories/audit-log-repository.interface";
import {
  RoleNotFoundError,
  PermissionNotFoundError,
  SystemRoleModificationError,
} from "../../domain/errors/rbac-errors";
import { invalidatePermissionCache } from "@/lib/permissions/cache";

export interface AssignPermissionsToRoleRequest {
  roleId: string;
  permissionIds: string[];
  assignedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class AssignPermissionsToRoleUseCase {
  constructor(
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(request: AssignPermissionsToRoleRequest): Promise<void> {
    // Validate role exists
    const role = await this.roleRepository.findById(request.roleId);
    if (!role) {
      throw new RoleNotFoundError(request.roleId);
    }

    // Protect system roles from modification
    if (role.isSystem) {
      throw new SystemRoleModificationError(role.name);
    }

    // Validate all permissions exist
    const permissions = await this.permissionRepository.findByIds(
      request.permissionIds,
    );
    if (permissions.length !== request.permissionIds.length) {
      const foundIds = permissions.map((p) => p.id);
      const missingIds = request.permissionIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new PermissionNotFoundError(missingIds.join(", "));
    }

    // Get current permissions for audit trail
    const beforePermissions = await this.roleRepository.getRolePermissions(
      request.roleId,
    );

    // Assign permissions to role
    await this.roleRepository.assignPermissions(
      request.roleId,
      request.permissionIds,
    );

    // Get updated permissions for audit trail
    const afterPermissions = await this.roleRepository.getRolePermissions(
      request.roleId,
    );

    // Log audit trail
    await this.auditLogRepository.create({
      userId: request.assignedBy,
      action: "role:assign-permissions",
      entityType: "role",
      entityId: request.roleId,
      changes: {
        before: { permissions: beforePermissions.map((p) => p.toString()) },
        after: { permissions: afterPermissions.map((p) => p.toString()) },
      },
      metadata: {
        addedPermissions: request.permissionIds,
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    // Invalidate cache for all users with this role
    // Since we don't have a quick way to find all users with this role,
    // we invalidate the entire cache to be safe
    invalidatePermissionCache("all");
  }
}
