/**
 * Create Permission Use Case
 *
 * Creates a new permission after validating it doesn't already exist.
 */

import { inject, injectable } from "inversify";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import { DI_TOKENS } from "@/di/types";
import { Permission } from "@/core/domain/entities/permission.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreatePermissionParams {
  resource: string;
  action: string;
  displayName: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
}

@injectable()
export class CreatePermissionUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(params: CreatePermissionParams): Promise<Permission> {
    // Check if permission already exists
    const name = `${params.resource.toLowerCase().trim()}:${params.action.toLowerCase().trim()}`;
    const existing = await this.permissionRepository.findByName(name);

    if (existing) {
      throw new Error(`Permission ${name} already exists`);
    }

    // Create permission entity
    const permission = Permission.create(
      {
        resource: params.resource,
        action: params.action,
        displayName: params.displayName,
        description: params.description,
        isSystem: params.isSystem ?? false,
        isActive: params.isActive ?? true,
      },
      this.idGenerator,
    );

    // Persist to database
    return this.permissionRepository.create(permission);
  }
}
