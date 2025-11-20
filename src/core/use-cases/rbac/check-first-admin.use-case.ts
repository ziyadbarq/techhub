/**
 * Check if First Admin Exists Use Case
 * Determines if there are any users with admin role
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";

export interface CheckFirstAdminResult {
  hasAdmin: boolean;
  adminRoleId: string | null;
}

@injectable()
export class CheckFirstAdminUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRoleRepository)
    private readonly userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(): Promise<CheckFirstAdminResult> {
    // Find admin role
    const adminRole = await this.roleRepository.findByName("admin");

    if (!adminRole) {
      // Admin role doesn't exist - seed data not run
      return {
        hasAdmin: false,
        adminRoleId: null,
      };
    }

    // Check if any user has admin role
    const adminUsers = await this.userRoleRepository.findByRoleId(adminRole.id);

    return {
      hasAdmin: adminUsers.length > 0,
      adminRoleId: adminRole.id,
    };
  }
}
