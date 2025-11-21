/**
 * Get Organization Unit Use Case
 *
 * Business logic for retrieving a single organization unit by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { OrganizationUnit } from "@/core/domain/entities/organization-unit.entity";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";

@injectable()
export class GetOrganizationUnitUseCase {
  constructor(
    @inject(DI_TOKENS.IOrganizationUnitRepository)
    private readonly organizationUnitRepository: IOrganizationUnitRepository,
  ) {}

  /**
   * Execute get organization unit use case
   *
   * @param id - Organization unit ID
   * @returns Organization unit or null if not found
   */
  async execute(id: string): Promise<OrganizationUnit | null> {
    return await this.organizationUnitRepository.findById(id);
  }
}
