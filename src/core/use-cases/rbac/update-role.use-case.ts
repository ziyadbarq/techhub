/**
 * Update Role Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { IAuditLogRepository } from "../../repositories/audit-log-repository.interface";
import type { Role } from "../../domain/entities/role.entity";
import {
  RoleNotFoundError,
  SystemRoleModificationError,
} from "../../domain/errors/rbac-errors";
import type { IPermissionCacheService } from "@/core/services/permission-cache.service.interface";

export interface UpdateRoleRequest {
  roleId: string;
  displayName?: string;
  description?: string;
  isActive?: boolean;
  updatedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class UpdateRoleUseCase {
  constructor(
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
    @inject(DI_TOKENS.IPermissionCacheService)
    private readonly permissionCacheService: IPermissionCacheService,
  ) {}

  async execute(request: UpdateRoleRequest): Promise<Role> {
    // Find existing role
    const existingRole = await this.roleRepository.findById(request.roleId);
    if (!existingRole) {
      throw new RoleNotFoundError(request.roleId);
    }

    // Protect system roles from modification
    if (existingRole.isSystem) {
      throw new SystemRoleModificationError(existingRole.name);
    }

    // Capture before state
    const beforeState = existingRole.toObject();

    // Update role entity
    const updatedRole = existingRole.update({
      displayName: request.displayName,
      description: request.description,
      isActive: request.isActive,
    });

    // Persist changes
    const savedRole = await this.roleRepository.update(updatedRole);

    // Log audit trail
    await this.auditLogRepository.create({
      userId: request.updatedBy,
      action: "role:update",
      entityType: "role",
      entityId: savedRole.id,
      changes: {
        before: beforeState,
        after: savedRole.toObject(),
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    // Role activation changes affect permissions
    this.permissionCacheService.invalidate("all");

    return savedRole;
  }
}
