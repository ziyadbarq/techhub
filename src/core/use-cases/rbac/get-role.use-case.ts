/**
 * Get Role Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { Role } from "../../domain/entities/role.entity";
import type { PermissionKey } from "../../domain/value-objects/permission-key";
import { RoleNotFoundError } from "../../domain/errors/rbac-errors";

export interface RoleWithPermissions {
  role: Role;
  permissions: PermissionKey[];
}

@injectable()
export class GetRoleUseCase {
  constructor(
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(roleId: string): Promise<RoleWithPermissions> {
    // Find role by ID
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }

    // Get role permissions
    const permissions = await this.roleRepository.getRolePermissions(roleId);

    return {
      role,
      permissions,
    };
  }
}
