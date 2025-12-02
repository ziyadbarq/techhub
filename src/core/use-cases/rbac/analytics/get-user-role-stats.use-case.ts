/**
 * Get User Role Statistics Use Case
 *
 * Returns statistics about user role assignments:
 * - Users with multiple roles
 * - Users with conflicting roles
 * - Users with no roles
 * - Average roles per user
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import { DI_TOKENS } from "@/di/types";
import type { IRbacPolicyService } from "@/core/services";
import { LogExecution } from "@/lib/decorators";

export interface UserRoleStatsResult {
  totalUsers: number;
  usersWithRoles: number;
  usersWithoutRoles: number;
  usersWithMultipleRoles: number;
  usersWithConflicts: number;
  averageRolesPerUser: number;
  maxRolesPerUser: number;
  usersByRoleCount: {
    roleCount: number;
    userCount: number;
  }[];
  topUsersWithMostRoles: {
    userId: string;
    userEmail: string;
    roleCount: number;
    roleNames: string[];
    hasConflicts: boolean;
  }[];
}

@injectable()
export class GetUserRoleStatsUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository)
    private userRepository: IUserRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IUserRoleRepository)
    private userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.IRbacPolicyService)
    private rbacPolicyService: IRbacPolicyService,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  @LogExecution("rbac.analytics.user_role_stats")
  async execute(): Promise<UserRoleStatsResult> {
    this.logger.info("Fetching user role statistics");

    try {
      // Get all users and user-role assignments
      const [users, userRoles, roles] = await Promise.all([
        this.userRepository.findAll(),
        this.userRoleRepository.findAll(),
        this.roleRepository.findAll(),
      ]);

      // Create role map for lookups
      const roleMap = new Map<string, (typeof roles)[number]>(
        roles.map((role) => [role.id, role]),
      );

      // Group user roles by user ID
      const userRoleMap = new Map<string, typeof userRoles>();
      for (const userRole of userRoles) {
        const existing = userRoleMap.get(userRole.userId) || [];
        userRoleMap.set(userRole.userId, [...existing, userRole]);
      }

      // Calculate statistics
      let usersWithRoles = 0;
      let usersWithMultipleRoles = 0;
      let usersWithConflicts = 0;
      let totalRoleCount = 0;
      let maxRolesPerUser = 0;
      const roleCountDistribution = new Map<number, number>();

      const userDetails: UserRoleStatsResult["topUsersWithMostRoles"] = [];

      for (const user of users) {
        const userRolesList = userRoleMap.get(user.id) || [];
        const roleCount = userRolesList.length;

        if (roleCount > 0) {
          usersWithRoles++;
          totalRoleCount += roleCount;

          if (roleCount > 1) {
            usersWithMultipleRoles++;
          }

          if (roleCount > maxRolesPerUser) {
            maxRolesPerUser = roleCount;
          }

          // Update distribution
          const currentCount = roleCountDistribution.get(roleCount) || 0;
          roleCountDistribution.set(roleCount, currentCount + 1);

          // Check for conflicts
          const roleNames = userRolesList
            .map((userRole) => roleMap.get(userRole.roleId)?.name)
            .filter((roleName): roleName is string => roleName !== undefined);

          const { hasConflicts } =
            this.rbacPolicyService.detectRoleConflicts(roleNames);
          if (hasConflicts) {
            usersWithConflicts++;
          }

          // Collect user details for top users
          userDetails.push({
            userId: user.id,
            userEmail: user.email,
            roleCount,
            roleNames,
            hasConflicts,
          });
        }
      }

      const usersWithoutRoles = users.length - usersWithRoles;
      const averageRolesPerUser =
        usersWithRoles > 0 ? totalRoleCount / usersWithRoles : 0;

      // Sort and get top users with most roles
      userDetails.sort((a, b) => b.roleCount - a.roleCount);
      const topUsersWithMostRoles = userDetails.slice(0, 10);

      // Convert distribution to array
      const usersByRoleCount = Array.from(roleCountDistribution.entries())
        .map(([roleCount, userCount]) => ({ roleCount, userCount }))
        .sort((a, b) => a.roleCount - b.roleCount);

      const stats: UserRoleStatsResult = {
        totalUsers: users.length,
        usersWithRoles,
        usersWithoutRoles,
        usersWithMultipleRoles,
        usersWithConflicts,
        averageRolesPerUser,
        maxRolesPerUser,
        usersByRoleCount,
        topUsersWithMostRoles,
      };

      this.logger.info("User role statistics fetched successfully", {
        totalUsers: stats.totalUsers,
        usersWithConflicts: stats.usersWithConflicts,
      });

      return stats;
    } catch (error) {
      this.logger.error(
        "Failed to fetch user role statistics",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }
}
