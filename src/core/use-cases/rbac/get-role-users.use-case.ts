/**
 * Get Role Users Use Case
 * Returns all users assigned to a specific role
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "../../repositories/user-role-repository.interface";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { UserRole } from "../../domain/entities/user-role.entity";
import type { Role } from "../../domain/entities/role.entity";
import { RoleNotFoundError } from "../../domain/errors/rbac-errors";

export interface GetRoleUsersRequest {
  roleId: string;
  includeExpired?: boolean;
}

export interface RoleUserAssignment {
  userId: string;
  assignment: UserRole;
  isActive: boolean;
  isExpired: boolean;
}

export interface GetRoleUsersResponse {
  role: Role;
  assignments: RoleUserAssignment[];
  totalCount: number;
  activeCount: number;
  expiredCount: number;
}

@injectable()
export class GetRoleUsersUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRoleRepository)
    private readonly userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(request: GetRoleUsersRequest): Promise<GetRoleUsersResponse> {
    // Verify role exists
    const role = await this.roleRepository.findById(request.roleId);
    if (!role) {
      throw new RoleNotFoundError(request.roleId);
    }

    // Get all user assignments for this role
    const userRoles = await this.userRoleRepository.findByRoleId(
      request.roleId,
    );

    // Filter out expired assignments unless explicitly requested
    const filteredUserRoles = request.includeExpired
      ? userRoles
      : userRoles.filter((ur) => ur.isActive());

    // Map to assignment details
    const assignments: RoleUserAssignment[] = filteredUserRoles.map(
      (userRole) => ({
        userId: userRole.userId,
        assignment: userRole,
        isActive: userRole.isActive(),
        isExpired: userRole.isExpired(),
      }),
    );

    // Calculate counts
    const activeCount = userRoles.filter((ur) => ur.isActive()).length;
    const expiredCount = userRoles.length - activeCount;

    return {
      role,
      assignments,
      totalCount: assignments.length,
      activeCount,
      expiredCount,
    };
  }
}
