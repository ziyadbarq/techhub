/**
 * Update Permission Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPermissionRepository } from "../../repositories/permission-repository.interface";
import type { IAuditLogRepository } from "../../repositories/audit-log-repository.interface";
import type { Permission } from "../../domain/entities/permission.entity";
import {
  PermissionNotFoundError,
  SystemPermissionModificationError,
} from "../../domain/errors/rbac-errors";

export interface UpdatePermissionRequest {
  id: string;
  displayName?: string;
  description?: string;
  isActive?: boolean;
  updatedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class UpdatePermissionUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(request: UpdatePermissionRequest): Promise<Permission> {
    // Find existing permission
    const existingPermission = await this.permissionRepository.findById(
      request.id,
    );
    if (!existingPermission) {
      throw new PermissionNotFoundError(request.id);
    }

    // Prevent modification of system permissions (except activation status)
    if (existingPermission.isSystem) {
      const onlyChangingActivation =
        request.isActive !== undefined &&
        request.displayName === undefined &&
        request.description === undefined;

      if (!onlyChangingActivation) {
        throw new SystemPermissionModificationError(existingPermission.name);
      }
    }

    // Capture state before update
    const beforeState = existingPermission.toObject();

    // Update permission
    const updatedPermission = existingPermission.update({
      displayName: request.displayName,
      description: request.description,
      isActive: request.isActive,
    });

    // Persist changes
    const savedPermission =
      await this.permissionRepository.update(updatedPermission);

    // Log audit trail
    await this.auditLogRepository.create({
      userId: request.updatedBy,
      action: "permission:update",
      entityType: "permission",
      entityId: savedPermission.id,
      changes: {
        before: beforeState,
        after: savedPermission.toObject(),
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });

    return savedPermission;
  }
}
