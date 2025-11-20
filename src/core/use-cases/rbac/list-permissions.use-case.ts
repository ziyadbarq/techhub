/**
 * List Permissions Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPermissionRepository } from "../../repositories/permission-repository.interface";
import type { Permission } from "../../domain/entities/permission.entity";

export interface ListPermissionsRequest {
  includeInactive?: boolean;
  resource?: string;
}

export interface ListPermissionsResponse {
  permissions: Permission[];
  total: number;
}

@injectable()
export class ListPermissionsUseCase {
  constructor(
    @inject(DI_TOKENS.IPermissionRepository)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(
    request: ListPermissionsRequest = {},
  ): Promise<ListPermissionsResponse> {
    let permissions: Permission[];

    // Filter by resource if provided
    if (request.resource) {
      permissions = await this.permissionRepository.findByResource(
        request.resource.toLowerCase().trim(),
      );

      // Filter by active status if needed
      if (!request.includeInactive) {
        permissions = permissions.filter((p) => p.isActive);
      }
    } else {
      // Get all permissions with optional inactive filter
      permissions = await this.permissionRepository.findAll({
        includeInactive: request.includeInactive,
      });
    }

    return {
      permissions,
      total: permissions.length,
    };
  }
}
