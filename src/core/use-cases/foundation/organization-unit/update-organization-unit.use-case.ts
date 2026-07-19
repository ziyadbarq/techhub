/**
 * Update Organization Unit Use Case
 *
 * Business logic for updating an existing organization unit.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { ConflictError } from "@/core/domain/errors/conflict.error";
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
        throw new ConflictError(
          `Organization unit with code "${props.code}" already exists`,
        );
      }
    }

    // If moving to new parent, check for circular references and recalculate levels
    if (
      props.parentId !== undefined &&
      props.parentId !== organizationUnit.parentId
    ) {
      const descendants = await this.organizationUnitRepository.findDescendants(
        props.id,
      );
      const childIds = descendants.map((d) => d.id);

      // Calculate new level based on new parent
      let newLevel = 1;
      if (props.parentId) {
        const newParent = await this.organizationUnitRepository.findById(
          props.parentId,
        );
        if (!newParent) {
          throw new NotFoundError("Parent organization unit not found");
        }
        newLevel = newParent.level + 1;
        if (newLevel > 10) {
          throw new ValidationError(
            "Maximum organization unit hierarchy depth (10 levels) exceeded",
          );
        }
      }

      // Calculate level difference to update descendants
      const levelDiff = newLevel - organizationUnit.level;

      // Move the unit (validates and updates level)
      organizationUnit.moveTo(props.parentId, childIds, newLevel);

      // Update descendants' levels if level changed
      if (levelDiff !== 0) {
        for (const descendant of descendants) {
          const newDescendantLevel = descendant.level + levelDiff;
          if (newDescendantLevel > 10) {
            throw new ValidationError(
              `Moving this unit would exceed maximum hierarchy depth (10 levels) for descendant "${descendant.name}"`,
            );
          }
          descendant.setLevel(newDescendantLevel);
          await this.organizationUnitRepository.update(descendant);
        }
      }
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
