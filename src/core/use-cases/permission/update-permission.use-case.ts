/**
 * Update Permission Use Case
 *
 * Updates an existing permission's display name, description, or active status.
 * System permissions cannot have their resource/action modified.
 */

import { inject, injectable } from "inversify";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import { DI_TOKENS } from "@/di/types";
import type { Permission } from "@/core/domain/entities/permission.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdatePermissionParams {
  id: string;
  displayName?: string;
  description?: string;
  isActive?: boolean;
}

@injectable()
export class UpdatePermissionUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(params: UpdatePermissionParams): Promise<Permission> {
    // Find existing permission
    const permission = await this.permissionRepository.findById(params.id);

    if (!permission) {
      throw new NotFoundError("Permission not found");
    }

    // Update permission entity
    const updated = permission.update({
      displayName: params.displayName,
      description: params.description,
      isActive: params.isActive,
    });

    // Persist changes
    return this.permissionRepository.update(updated);
  }
}
