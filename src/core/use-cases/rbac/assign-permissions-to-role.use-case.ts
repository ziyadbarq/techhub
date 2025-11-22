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
import { validatePermissionDependencies } from "@/lib/rbac/permission-dependencies";
import type { PermissionKey } from "../../domain/value-objects/permission-key";

export interface AssignPermissionsToRoleRequest {
  roleId: string;
  permissionIds: string[];
  assignedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  autoAddDependencies?: boolean; // Auto-add missing dependencies instead of rejecting
}

export class PermissionDependencyError extends Error {
  constructor(
    public readonly missing: Array<{
      permission: PermissionKey;
      requiredDependencies: PermissionKey[];
    }>,
    message?: string,
  ) {
    super(
      message || "Permission assignment blocked due to missing dependencies",
    );
    this.name = "PermissionDependencyError";
  }
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

    // Convert permission IDs to permission names for dependency validation
    const permissionNames = permissions.map((p) => p.name) as PermissionKey[];

    // Validate permission dependencies
    const dependencyValidation =
      validatePermissionDependencies(permissionNames);

    if (!dependencyValidation.valid) {
      if (request.autoAddDependencies) {
        // Auto-add missing dependencies
        const allPermissions = await this.permissionRepository.findAll();
        const missingDeps = new Set<PermissionKey>();
        dependencyValidation.missing.forEach((item) => {
          item.requiredDependencies.forEach((dep) => missingDeps.add(dep));
        });

        // Find IDs for missing dependencies
        const missingDepIds = allPermissions
          .filter((p) => missingDeps.has(p.name as PermissionKey))
          .map((p) => p.id);

        // Add missing dependencies to the request
        request.permissionIds = [
          ...request.permissionIds,
          ...missingDepIds.filter((id) => !request.permissionIds.includes(id)),
        ];
      } else {
        // Block save if dependencies are missing and auto-add is not enabled
        // Log blocked assignment
        await this.auditLogRepository.create({
          userId: request.assignedBy,
          action: "role:assign-permissions_blocked",
          entityType: "role",
          entityId: request.roleId,
          changes: {
            attempted: {
              permissionIds: request.permissionIds,
            },
            dependencies: dependencyValidation.missing.map((item) => ({
              permission: item.permission,
              requiredDependencies: item.requiredDependencies,
            })),
            reason: "MISSING_PERMISSION_DEPENDENCIES",
          },
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
        });

        throw new PermissionDependencyError(dependencyValidation.missing);
      }
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
        ...(request.autoAddDependencies &&
          !dependencyValidation.valid && {
            autoAddedDependencies: dependencyValidation.missing.flatMap(
              (item) => item.requiredDependencies,
            ),
          }),
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
