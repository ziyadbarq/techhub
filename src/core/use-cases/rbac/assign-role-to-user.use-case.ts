/**
 * Assign Role to User Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "../../repositories/user-role-repository.interface";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { IAuditLogRepository } from "../../repositories/audit-log-repository.interface";
import { UserRole } from "../../domain/entities/user-role.entity";
import {
  RoleNotFoundError,
  RoleAlreadyAssignedError,
} from "../../domain/errors/rbac-errors";
import { invalidatePermissionCache } from "@/lib/permissions/cache";

export interface AssignRoleToUserRequest {
  userId: string;
  roleId: string;
  expiresAt?: Date;
  assignedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class AssignRoleToUserUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRoleRepository)
    private readonly userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(request: AssignRoleToUserRequest): Promise<UserRole> {
    // Verify role exists
    const role = await this.roleRepository.findById(request.roleId);
    if (!role) {
      throw new RoleNotFoundError(request.roleId);
    }

    // Check if role is already assigned to user
    const existingAssignment =
      await this.userRoleRepository.findByUserIdAndRoleId(
        request.userId,
        request.roleId,
      );

    if (existingAssignment) {
      // If assignment exists and is active, throw error
      if (existingAssignment.isActive()) {
        throw new RoleAlreadyAssignedError(request.userId, request.roleId);
      }

      // If assignment exists but is expired, we'll create a new one (audit trail)
    }

    // Create user role assignment
    const userRole = UserRole.create({
      userId: request.userId,
      roleId: request.roleId,
      expiresAt: request.expiresAt,
      createdBy: request.assignedBy,
    });

    // Persist assignment
    const createdUserRole = await this.userRoleRepository.create(userRole);

    // Log audit trail
    await this.auditLogRepository.create({
      userId: request.assignedBy,
      action: "user_role:assign",
      entityType: "user_role",
      entityId: createdUserRole.id,
      changes: {
        after: {
          userId: createdUserRole.userId,
          roleId: createdUserRole.roleId,
          roleName: role.name,
          expiresAt: createdUserRole.expiresAt,
        },
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    // Invalidate permission cache for the user
    invalidatePermissionCache("user", request.userId);

    return createdUserRole;
  }
}
