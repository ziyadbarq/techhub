/**
 * Check Permission Use Case
 * Core use case for checking if a user has a specific permission
 * Uses in-memory caching for performance
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "../../repositories/user-role-repository.interface";
import type { ILoggerService } from "../../services/logger.service.interface";
import type { PermissionKey } from "../../domain/value-objects/permission-key";
import { InsufficientPermissionsError } from "../../domain/errors/rbac-errors";
import { permissionCache } from "@/lib/permissions/cache";

export interface CheckPermissionRequest {
  userId: string;
  permission: PermissionKey;
  context?: {
    resourceOwnerId?: string;
    [key: string]: unknown;
  };
}

@injectable()
export class CheckPermissionUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRoleRepository)
    private readonly userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(request: CheckPermissionRequest): Promise<boolean> {
    const { userId, permission, context } = request;

    // Try to get permissions from cache
    let userPermissions = permissionCache.get(userId);
    let cacheHit = userPermissions !== null;

    if (!userPermissions) {
      // Cache miss - fetch from database
      const timer = this.logger.startTimer("permission.check.db_fetch");
      userPermissions =
        await this.userRoleRepository.getUserPermissions(userId);
      this.logger.endTimer(timer, {
        userId,
        permissionCount: userPermissions.length,
      });

      // Store in cache
      permissionCache.set(userId, userPermissions);
      cacheHit = false;
    }

    // Log cache performance
    this.logger.debug("Permission check", {
      userId,
      permission,
      cacheHit,
      hasPermission: userPermissions.includes(permission),
    });

    const isOwnershipPermission = permission.endsWith(":own");

    if (isOwnershipPermission) {
      if (!context?.resourceOwnerId) {
        return false;
      }

      const basePermission = permission.replace(":own", "") as PermissionKey;
      const hasBasePermission = userPermissions.includes(basePermission);
      const hasOwnPermission = userPermissions.includes(permission);

      if (!hasBasePermission && !hasOwnPermission) {
        return false;
      }

      return context.resourceOwnerId === userId;
    }

    // Check for exact permission match (non-ownership)
    if (userPermissions.includes(permission)) {
      return true;
    }

    return false;
  }

  async executeOrThrow(request: CheckPermissionRequest): Promise<void> {
    const hasPermission = await this.execute(request);

    if (!hasPermission) {
      throw new InsufficientPermissionsError(
        request.permission,
        request.userId,
      );
    }
  }
}
