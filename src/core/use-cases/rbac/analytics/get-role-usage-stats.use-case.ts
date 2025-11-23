/**
 * Get Role Usage Statistics Use Case
 *
 * Returns statistics about role usage:
 * - Number of users per role
 * - Orphaned roles (no users)
 * - Most/least used roles
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IUserRoleRepository } from "@/core/repositories/user-role.repository.interface";
import type { IRoleRepository } from "@/core/repositories/role.repository.interface";
import { DI_TOKENS } from "@/di/types";

export interface RoleUsageStats {
  roleId: string;
  roleName: string;
  roleDisplayName: string;
  userCount: number;
  isOrphaned: boolean;
}

@injectable()
export class GetRoleUsageStatsUseCase {
  constructor(
    @inject(DI_TOKENS.IRoleRepository)
    private roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IUserRoleRepository)
    private userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async execute(): Promise<RoleUsageStats[]> {
    this.logger.info("Fetching role usage statistics");

    try {
      // Get all roles
      const roles = await this.roleRepository.findAll();

      // Get all user-role assignments
      const userRoles = await this.userRoleRepository.findAll();

      // Count users per role
      const roleUsageMap = new Map<string, number>();
      for (const userRole of userRoles) {
        const currentCount = roleUsageMap.get(userRole.roleId) || 0;
        roleUsageMap.set(userRole.roleId, currentCount + 1);
      }

      // Build statistics
      const stats: RoleUsageStats[] = roles.map((role) => {
        const userCount = roleUsageMap.get(role.id) || 0;
        return {
          roleId: role.id,
          roleName: role.name,
          roleDisplayName: role.displayName,
          userCount,
          isOrphaned: userCount === 0,
        };
      });

      // Sort by user count descending
      stats.sort((a, b) => b.userCount - a.userCount);

      this.logger.info("Role usage statistics fetched successfully", {
        totalRoles: stats.length,
        orphanedRoles: stats.filter((s) => s.isOrphaned).length,
      });

      return stats;
    } catch (error) {
      this.logger.error("Failed to fetch role usage statistics", { error });
      throw error;
    }
  }
}
