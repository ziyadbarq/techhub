/**
 * Feature Flag Auth Utilities
 * Helper functions for checking user roles
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";

/**
 * Check if a user is a system administrator
 * System administrators bypass all feature flags
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
    console.error("Error checking if user is system administrator:", error);
    return false;
  }
}
