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
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";

export interface CreateOrganizationUnitProps {
  code?: string;
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
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  /**
   * Execute create organization unit use case
   *
   * @param props - Organization unit creation properties
   * @returns Created organization unit
   * @throws Error if code already exists
   */
  async execute(props: CreateOrganizationUnitProps): Promise<OrganizationUnit> {
    // Auto-generate code if not provided
    const code =
      props.code ??
      (await this.codeGenerator.generateCode("ORGANIZATION_UNIT", "ORG"));

    // Check for duplicate code
    const existsByCode =
      await this.organizationUnitRepository.existsByCode(code);
    if (existsByCode) {
      throw new Error(`Organization unit with code "${code}" already exists`);
    }

    const organizationUnit = OrganizationUnit.create({ ...props, code });
    const created =
      await this.organizationUnitRepository.create(organizationUnit);
    return created;
  }
}
