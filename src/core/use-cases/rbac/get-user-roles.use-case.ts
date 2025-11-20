/**
 * Get User Roles Use Case
 * Returns all roles assigned to a user
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "../../repositories/user-role-repository.interface";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { UserRole } from "../../domain/entities/user-role.entity";
import type { Role } from "../../domain/entities/role.entity";

export interface GetUserRolesRequest {
  userId: string;
  includeExpired?: boolean;
}

export interface UserRoleWithDetails {
  assignment: UserRole;
  role: Role;
}

export interface GetUserRolesResponse {
  userId: string;
  roles: UserRoleWithDetails[];
  activeCount: number;
  expiredCount: number;
}

@injectable()
export class GetUserRolesUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRoleRepository)
    private readonly userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(request: GetUserRolesRequest): Promise<GetUserRolesResponse> {
    // Get all role assignments for the user
    const userRoles = await this.userRoleRepository.findByUserId(
      request.userId,
    );

    // Filter out expired roles unless explicitly requested
    const filteredUserRoles = request.includeExpired
      ? userRoles
      : userRoles.filter((ur) => ur.isActive());

    // Get role details for all assignments
    const roleIds = filteredUserRoles.map((ur) => ur.roleId);
    const roles = await this.roleRepository.findByIds(roleIds);

    // Create a map for quick lookup
    const roleMap = new Map(roles.map((role) => [role.id, role]));

    // Combine assignments with role details
    const rolesWithDetails: UserRoleWithDetails[] = filteredUserRoles
      .map((assignment) => {
        const role = roleMap.get(assignment.roleId);
        if (!role) {
          // Role was deleted - skip this assignment
          return null;
        }

        return {
          assignment,
          role,
        };
      })
      .filter((item): item is UserRoleWithDetails => item !== null);

    // Calculate counts
    const activeCount = userRoles.filter((ur) => ur.isActive()).length;
    const expiredCount = userRoles.length - activeCount;

    return {
      userId: request.userId,
      roles: rolesWithDetails,
      activeCount,
      expiredCount,
    };
  }
}
