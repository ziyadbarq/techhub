/**
 * Get Permission Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPermissionRepository } from "../../repositories/permission-repository.interface";
import type { Permission } from "../../domain/entities/permission.entity";
import { PermissionNotFoundError } from "../../domain/errors/rbac-errors";

export interface GetPermissionRequest {
  id?: string;
  name?: string;
}

@injectable()
export class GetPermissionUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(request: GetPermissionRequest): Promise<Permission> {
    // Validate that at least one identifier is provided
    if (!request.id && !request.name) {
      throw new Error("Either id or name must be provided");
    }

    let permission: Permission | null = null;

    // Find by ID if provided
    if (request.id) {
      permission = await this.permissionRepository.findById(request.id);
    }
    // Otherwise find by name
    else if (request.name) {
      permission = await this.permissionRepository.findByName(request.name);
    }

    if (!permission) {
      const identifier = request.id || request.name || "unknown";
      throw new PermissionNotFoundError(identifier);
    }

    return permission;
  }
}
