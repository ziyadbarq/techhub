/**
 * Create Organization Unit Use Case
 *
 * Business logic for creating a new organization unit.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { OrganizationUnit } from "@/core/domain/entities/organization-unit.entity";
import type { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";

export interface CreateOrganizationUnitProps {
  code: string;
  name: string;
  description?: string;
  parentId?: string | null;
  unitType: OrganizationUnitType;
  level: number;
  managerId?: string | null;
  costCenter?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class CreateOrganizationUnitUseCase {
  constructor(
    @inject(DI_TOKENS.IOrganizationUnitRepository)
    private readonly organizationUnitRepository: IOrganizationUnitRepository,
  ) {}

  /**
   * Execute create organization unit use case
   *
   * @param props - Organization unit creation properties
   * @returns Created organization unit
   * @throws Error if code already exists
   */
  async execute(props: CreateOrganizationUnitProps): Promise<OrganizationUnit> {
    // Check for duplicate code
    const existsByCode = await this.organizationUnitRepository.existsByCode(
      props.code,
    );
    if (existsByCode) {
      throw new Error(
        `Organization unit with code "${props.code}" already exists`,
      );
    }

    const organizationUnit = OrganizationUnit.create(props);
    const created =
      await this.organizationUnitRepository.create(organizationUnit);
    return created;
  }
}
