/**
 * List Organization Units Use Case
 *
 * Business logic for listing organization units with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { OrganizationUnit } from "@/core/domain/entities/organization-unit.entity";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";

export interface ListOrganizationUnitsOptions {
  skip?: number;
  take?: number;
  orderBy?: "name" | "code" | "level" | "createdAt";
  order?: "asc" | "desc";
  parentId?: string;
  isActive?: boolean;
  level?: number;
}

@injectable()
export class ListOrganizationUnitsUseCase {
  constructor(
    @inject(DI_TOKENS.IOrganizationUnitRepository)
    private readonly organizationUnitRepository: IOrganizationUnitRepository,
  ) {}

  /**
   * Execute list organization units use case
   *
   * @param options - Optional filter options
   * @returns Array of organization units
   */
  async execute(
    options?: ListOrganizationUnitsOptions,
  ): Promise<OrganizationUnit[]> {
    if (options?.parentId === null) {
      return await this.organizationUnitRepository.findRoots();
    }

    if (options?.parentId) {
      return await this.organizationUnitRepository.findChildren(
        options.parentId,
      );
    }

    if (options?.level !== undefined) {
      return await this.organizationUnitRepository.findByLevel(options.level);
    }

    if (options?.isActive !== undefined) {
      if (options.isActive) {
        return await this.organizationUnitRepository.findActive(options);
      } else {
        return await this.organizationUnitRepository.findInactive(options);
      }
    }

    return await this.organizationUnitRepository.findAll(options);
  }
}
