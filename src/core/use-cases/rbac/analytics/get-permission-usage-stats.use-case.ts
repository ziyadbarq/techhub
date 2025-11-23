/**
 * Get Permission Usage Statistics Use Case
 *
 * Returns statistics about permission usage:
 * - Number of roles using each permission
 * - Unused permissions
 * - Most/least used permissions
 */

import { inject, injectable } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import { DI_TOKENS } from "@/di/types";
import {
  PERMISSIONS,
  type PermissionKey,
} from "@/core/domain/value-objects/permission-key";

export interface PermissionUsageStats {
  permission: PermissionKey;
  roleCount: number;
  isUnused: boolean;
}

@injectable()
export class GetPermissionUsageStatsUseCase {
  constructor(
    @inject(DI_TOKENS.IRoleRepository)
    private roleRepository: IRoleRepository,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async execute(): Promise<PermissionUsageStats[]> {
    this.logger.info("Fetching permission usage statistics");

    try {
      // Get all roles with their permissions
      const roles = await this.roleRepository.findAll();

      // Count roles per permission
      const permissionUsageMap = new Map<PermissionKey, number>();
      for (const role of roles) {
        for (const permission of role.permissions) {
          const currentCount = permissionUsageMap.get(permission) || 0;
          permissionUsageMap.set(permission, currentCount + 1);
        }
      }

      // Get all available permissions
      const allPermissions = Object.values(PERMISSIONS) as PermissionKey[];

      // Build statistics
      const stats: PermissionUsageStats[] = allPermissions.map((permission) => {
        const roleCount = permissionUsageMap.get(permission) || 0;
        return {
          permission,
          roleCount,
          isUnused: roleCount === 0,
        };
      });

      // Sort by role count descending
      stats.sort((a, b) => b.roleCount - a.roleCount);

      this.logger.info("Permission usage statistics fetched successfully", {
        totalPermissions: stats.length,
        unusedPermissions: stats.filter((s) => s.isUnused).length,
      });

      return stats;
    } catch (error) {
      this.logger.error(
        "Failed to fetch permission usage statistics",
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }
}
