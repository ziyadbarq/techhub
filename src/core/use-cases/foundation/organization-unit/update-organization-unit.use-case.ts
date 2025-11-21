/**
 * Update Organization Unit Use Case
 *
 * Business logic for updating an existing organization unit.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { OrganizationUnit } from "@/core/domain/entities/organization-unit.entity";
import type { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";

export interface UpdateOrganizationUnitProps {
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  parentId?: string | null;
  unitType?: OrganizationUnitType;
  managerId?: string | null;
  costCenter?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdateOrganizationUnitUseCase {
  constructor(
    @inject(DI_TOKENS.IOrganizationUnitRepository)
    private readonly organizationUnitRepository: IOrganizationUnitRepository,
  ) {}

  /**
   * Execute update organization unit use case
   *
   * @param props - Update properties
   * @returns Updated organization unit
   * @throws NotFoundError if organization unit not found
   * @throws Error if code already exists or circular reference detected
   */
  async execute(props: UpdateOrganizationUnitProps): Promise<OrganizationUnit> {
    // Fetch existing organization unit
    const organizationUnit = await this.organizationUnitRepository.findById(
      props.id,
    );
    if (!organizationUnit) {
      throw new NotFoundError(
        "Organization unit not found",
        "OrganizationUnit",
        props.id,
      );
    }

    // Check for duplicate code if changing
    if (props.code !== undefined && props.code !== organizationUnit.code) {
      const existsByCode = await this.organizationUnitRepository.existsByCode(
        props.code,
        props.id,
      );
      if (existsByCode) {
        throw new Error(
          `Organization unit with code "${props.code}" already exists`,
        );
      }
    }

    // If moving to new parent, check for circular references
    if (
      props.parentId !== undefined &&
      props.parentId !== organizationUnit.parentId
    ) {
      const descendants = await this.organizationUnitRepository.findDescendants(
        props.id,
      );
      const childIds = descendants.map((d) => d.id);
      organizationUnit.moveTo(props.parentId, childIds);
    }

    // Update using entity's update method (includes validation)
    organizationUnit.update({
      name: props.name,
      code: props.code,
      description: props.description,
      unitType: props.unitType,
      managerId: props.managerId,
      costCenter: props.costCenter,
      note: props.note,
      metadata: props.metadata,
    });

    // Persist changes
    return await this.organizationUnitRepository.update(organizationUnit);
  }
}
