/**
 * List Permissions Use Case
 *
 * Retrieves all permissions from the repository with optional filtering.
 */

import { inject, injectable } from "inversify";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import { DI_TOKENS } from "@/di/types";
import type { Permission } from "@/core/domain/entities/permission.entity";

export interface ListPermissionsFilter {
  includeInactive?: boolean;
}

@injectable()
export class ListPermissionsUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(filter?: ListPermissionsFilter): Promise<Permission[]> {
    return this.permissionRepository.findAll({
      includeInactive: filter?.includeInactive ?? false,
    });
  }
}
