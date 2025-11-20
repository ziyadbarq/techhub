/**
 * Delete Permission Use Case
 *
 * Deletes a permission. System permissions cannot be deleted.
 */

import { inject, injectable } from "inversify";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import { DI_TOKENS } from "@/di/types";

@injectable()
export class DeletePermissionUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Find existing permission
    const permission = await this.permissionRepository.findById(id);

    if (!permission) {
      throw new Error("Permission not found");
    }

    // Check if permission can be deleted
    if (!permission.canBeDeleted()) {
      throw new Error("Cannot delete system permission");
    }

    // Delete from database
    await this.permissionRepository.delete(id);
  }
}
