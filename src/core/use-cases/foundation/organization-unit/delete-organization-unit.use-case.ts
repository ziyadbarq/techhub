/**
 * Delete Organization Unit Use Case
 *
 * Business logic for deleting an organization unit.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";

@injectable()
export class DeleteOrganizationUnitUseCase {
  constructor(
    @inject(DI_TOKENS.IOrganizationUnitRepository)
    private readonly organizationUnitRepository: IOrganizationUnitRepository,
  ) {}

  /**
   * Execute delete organization unit use case
   *
   * @param id - Organization unit ID to delete
   * @throws NotFoundError if organization unit not found
   * @throws Error if organization unit has children or people
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const organizationUnit = await this.organizationUnitRepository.findById(id);
    if (!organizationUnit) {
      throw new NotFoundError(
        "Organization unit not found",
        "OrganizationUnit",
        id,
      );
    }

    // Check for children
    const hasChildren = await this.organizationUnitRepository.hasChildren(id);
    if (hasChildren) {
      throw new Error(
        "Cannot delete organization unit because it has child units. Delete or move children first.",
      );
    }

    // Check for people
    const hasPeople = await this.organizationUnitRepository.hasPeople(id);
    if (hasPeople) {
      throw new Error(
        "Cannot delete organization unit because it has assigned people. Reassign people first.",
      );
    }

    await this.organizationUnitRepository.delete(id);
  }
}
