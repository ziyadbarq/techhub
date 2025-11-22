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
import { validateRoleAddition } from "@/lib/rbac/role-conflicts";
import type { RoleConflict } from "@/lib/rbac/role-conflicts";

export interface AssignRoleToUserRequest {
  userId: string;
  roleId: string;
  expiresAt?: Date;
  assignedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  allowConflictOverride?: boolean; // For future use with justification
}

export class RoleConflictError extends Error {
  constructor(
    public readonly conflicts: RoleConflict[],
    message?: string,
  ) {
    super(message || "Role assignment blocked due to critical conflicts");
    this.name = "RoleConflictError";
  }
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

    // Get user's current active roles to check for conflicts
    const currentRoles = await this.userRoleRepository.findByUserId(
      request.userId,
    );
    const activeRoleIds = currentRoles
      .filter((ur) => ur.isActive())
      .map((ur) => ur.roleId);

    // Fetch role names for conflict detection
    const activeRoleNames: string[] = [];
    for (const roleId of activeRoleIds) {
      const r = await this.roleRepository.findById(roleId);
      if (r) {
        activeRoleNames.push(r.name);
      }
    }

    // Validate role conflicts
    const conflictValidation = validateRoleAddition(activeRoleNames, role.name);

    // Block assignment if critical conflicts exist
    const hasCriticalConflicts = conflictValidation.conflicts.some(
      (c) => c.severity === "critical" && !c.config.allowOverride,
    );

    if (hasCriticalConflicts && !request.allowConflictOverride) {
      // Log blocked assignment
      await this.auditLogRepository.create({
        userId: request.assignedBy,
        action: "user_role:assign_blocked",
        entityType: "user_role",
        entityId: undefined,
        changes: {
          attempted: {
            userId: request.userId,
            roleId: request.roleId,
            roleName: role.name,
          },
          conflicts: conflictValidation.conflicts.map((c) => ({
            role1: c.role1,
            role2: c.role2,
            severity: c.severity,
            reason: c.reason,
          })),
          reason: "CRITICAL_ROLE_CONFLICT",
        },
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      });

      throw new RoleConflictError(conflictValidation.conflicts);
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

    // Log audit trail (include warnings/errors if present)
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
        ...(conflictValidation.conflicts.length > 0 && {
          conflicts: conflictValidation.conflicts.map((c) => ({
            role1: c.role1,
            role2: c.role2,
            severity: c.severity,
            reason: c.reason,
          })),
        }),
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    // Invalidate permission cache for the user
    invalidatePermissionCache("user", request.userId);

    return createdUserRole;
  }
}
