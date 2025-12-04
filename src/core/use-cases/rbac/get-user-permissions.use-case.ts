/**
 * Get User Permissions Use Case
 * Returns all permissions aggregated from user's assigned roles
 * Uses permission cache service for consistency with CheckPermissionUseCase
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "../../repositories/user-role-repository.interface";
import type { IPermissionCacheService } from "@/core/services/permission-cache.service.interface";
import type { PermissionKey } from "../../domain/value-objects/permission-key";

export interface GetUserPermissionsRequest {
  userId: string;
}

export interface GetUserPermissionsResponse {
  userId: string;
  permissions: PermissionKey[];
  activeRoleCount: number;
}

@injectable()
export class GetUserPermissionsUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRoleRepository)
    private readonly userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.IPermissionCacheService)
    private readonly permissionCacheService: IPermissionCacheService,
  ) {}

  async execute(
    request: GetUserPermissionsRequest,
  ): Promise<GetUserPermissionsResponse> {
    // Try to get permissions from cache first (consistent with CheckPermissionUseCase)
    let permissions = await this.permissionCacheService.get(request.userId);

    if (!permissions) {
      // Cache miss - fetch from database
      permissions = await this.userRoleRepository.getUserPermissions(
        request.userId,
      );

      // Store in cache for future requests
      await this.permissionCacheService.set(request.userId, permissions);
    }

    // Get active roles count for additional context
    const userRoles = await this.userRoleRepository.findByUserId(
      request.userId,
    );
    const activeRoleCount = userRoles.filter((ur) => ur.isActive()).length;

    return {
      userId: request.userId,
      permissions,
      activeRoleCount,
    };
  }
}
