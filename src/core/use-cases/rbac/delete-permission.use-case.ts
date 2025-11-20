/**
 * Delete Permission Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPermissionRepository } from "../../repositories/permission-repository.interface";
import type { IAuditLogRepository } from "../../repositories/audit-log-repository.interface";
import {
  PermissionNotFoundError,
  SystemPermissionModificationError,
} from "../../domain/errors/rbac-errors";

export interface DeletePermissionRequest {
  id: string;
  deletedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class DeletePermissionUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
    @inject(DI_TOKENS.IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(request: DeletePermissionRequest): Promise<void> {
    // Find existing permission
    const existingPermission = await this.permissionRepository.findById(
      request.id,
    );
    if (!existingPermission) {
      throw new PermissionNotFoundError(request.id);
    }

    // Prevent deletion of system permissions
    if (!existingPermission.canBeDeleted()) {
      throw new SystemPermissionModificationError(existingPermission.name);
    }

    // Capture state before deletion
    const beforeState = existingPermission.toObject();

    // Delete permission
    await this.permissionRepository.delete(request.id);

    // Log audit trail
    await this.auditLogRepository.create({
      userId: request.deletedBy,
      action: "permission:delete",
      entityType: "permission",
      entityId: request.id,
      changes: {
        before: beforeState,
      },
      metadata: {
        permissionName: existingPermission.name,
        wasSystem: existingPermission.isSystem,
      },
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });
  }
}
