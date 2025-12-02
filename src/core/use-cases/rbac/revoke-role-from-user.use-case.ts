/**
 * Revoke Role from User Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "../../repositories/user-role-repository.interface";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { IAuditLogRepository } from "../../repositories/audit-log-repository.interface";
import { RoleNotFoundError } from "../../domain/errors/rbac-errors";
import type { IPermissionCacheService } from "@/core/services/permission-cache.service.interface";

export interface RevokeRoleFromUserRequest {
  userId: string;
  roleId: string;
  revokedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class RevokeRoleFromUserUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRoleRepository)
    private readonly userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
    @inject(DI_TOKENS.IPermissionCacheService)
    private readonly permissionCacheService: IPermissionCacheService,
  ) {}

  async execute(request: RevokeRoleFromUserRequest): Promise<void> {
    // Verify role exists
    const role = await this.roleRepository.findById(request.roleId);
    if (!role) {
      throw new RoleNotFoundError(request.roleId);
    }

    // Find the user role assignment
    const userRole = await this.userRoleRepository.findByUserIdAndRoleId(
      request.userId,
      request.roleId,
    );

    // If assignment doesn't exist, silently succeed (idempotent)
    if (!userRole) {
      return;
    }

    // Store assignment details for audit log before deletion
    const assignmentDetails = {
      userId: userRole.userId,
      roleId: userRole.roleId,
      roleName: role.name,
      expiresAt: userRole.expiresAt,
      wasActive: userRole.isActive(),
    };

    // Delete the assignment
    await this.userRoleRepository.deleteByUserIdAndRoleId(
      request.userId,
      request.roleId,
    );

    // Log audit trail
    await this.auditLogRepository.create({
      userId: request.revokedBy,
      action: "user_role:revoke",
      entityType: "user_role",
      entityId: userRole.id,
      changes: {
        before: assignmentDetails,
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    // Invalidate permission cache for the user
    this.permissionCacheService.invalidate("user", request.userId);
  }
}
