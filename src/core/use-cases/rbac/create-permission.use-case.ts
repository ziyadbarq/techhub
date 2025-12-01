/**
 * Create Permission Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPermissionRepository } from "../../repositories/permission-repository.interface";
import type { IAuditLogRepository } from "../../repositories/audit-log-repository.interface";
import { Permission } from "../../domain/entities/permission.entity";
import { DuplicatePermissionError } from "../../domain/errors/rbac-errors";
import { invalidatePermissionCache } from "@/lib/permissions/cache";

export interface CreatePermissionRequest {
  resource: string;
  action: string;
  displayName: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
  createdBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class CreatePermissionUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(request: CreatePermissionRequest): Promise<Permission> {
    // Generate permission name from resource:action pattern
    const resource = request.resource.toLowerCase().trim();
    const action = request.action.toLowerCase().trim();
    const permissionName = `${resource}:${action}`;

    // Check if permission already exists
    const exists = await this.permissionRepository.existsByName(permissionName);
    if (exists) {
      throw new DuplicatePermissionError(permissionName);
    }

    // Create permission entity
    const permission = Permission.create({
      resource: request.resource,
      action: request.action,
      displayName: request.displayName,
      description: request.description,
      isSystem: request.isSystem,
      isActive: request.isActive,
    });

    // Persist permission
    const createdPermission =
      await this.permissionRepository.create(permission);

    // Log audit trail
    await this.auditLogRepository.create({
      userId: request.createdBy,
      action: "permission:create",
      entityType: "permission",
      entityId: createdPermission.id,
      changes: {
        after: createdPermission.toObject(),
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    // New permissions can be assigned immediately
    invalidatePermissionCache("all");

    return createdPermission;
  }
}
