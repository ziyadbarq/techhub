/**
 * Feature Flag Auth Utilities
 * Helper functions for checking user roles
 */

import { getContainer } from "@/di/container";
import { logger } from "@/lib/logger";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";

const moduleLogger = logger.scope("FeatureAuthUtils");

/**
 * Check if a user is a system administrator
 */
export async function isUserSystemAdministrator(
  userId: string,
): Promise<boolean> {
  try {
    const container = getContainer();
    const userRoleRepo = container.get<IUserRoleRepository>(
      DI_TOKENS.IUserRoleRepository,
    );
    const roleRepo = container.get<IRoleRepository>(DI_TOKENS.IRoleRepository);

    // Get user's roles
    const userRoles = await userRoleRepo.findByUserId(userId);
    if (userRoles.length === 0) {
      return false;
    }

    // Get system-administrator role
    const adminRole = await roleRepo.findByName("system-administrator");
    if (!adminRole) {
      return false;
    }

    // Check if user has system-administrator role
    return userRoles.some((userRole) => userRole.roleId === adminRole.id);
  } catch (error) {
    moduleLogger.error(
      "handler",
      "Error checking if user is system administrator:",
      error,
    );
    return false;
  }
}
