/**
 * Get Permission Use Case
 *
 * Retrieves a single permission by ID.
 */

import { inject, injectable } from "inversify";
import type { IPermissionRepository } from "@/core/repositories/permission-repository.interface";
import { DI_TOKENS } from "@/di/types";
import type { Permission } from "@/core/domain/entities/permission.entity";

@injectable()
export class GetPermissionUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(id: string): Promise<Permission | null> {
    return this.permissionRepository.findById(id);
  }
}
