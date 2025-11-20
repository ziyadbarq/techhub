/**
 * Get User Permissions Use Case
 * Returns all permissions aggregated from user's assigned roles
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "../../repositories/user-role-repository.interface";
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
  ) {}

  async execute(
    request: GetUserPermissionsRequest,
  ): Promise<GetUserPermissionsResponse> {
    // Get all permissions for the user (repository handles role aggregation and filtering expired roles)
    const permissions = await this.userRoleRepository.getUserPermissions(
      request.userId,
    );

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
