/**
 * List Roles Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRoleRepository } from "../../repositories/role-repository.interface";
import type { Role } from "../../domain/entities/role.entity";

export interface ListRolesRequest {
  includeInactive?: boolean;
}

@injectable()
export class ListRolesUseCase {
  constructor(
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(request: ListRolesRequest = {}): Promise<Role[]> {
    // Fetch roles with optional inactive filter
    const roles = await this.roleRepository.findAll({
      includeInactive: request.includeInactive ?? false,
    });

    return roles;
  }
}
