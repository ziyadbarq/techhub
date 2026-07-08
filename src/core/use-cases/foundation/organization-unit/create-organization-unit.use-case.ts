/**
 * Create Organization Unit Use Case
 *
 * Business logic for creating a new organization unit.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { OrganizationUnit } from "@/core/domain/entities/organization-unit.entity";
import type { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CreateOrganizationUnitProps {
  code?: string;
  name: string;
  description?: string;
  parentId?: string | null;
  unitType: OrganizationUnitType;
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
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  /**
   * Execute create organization unit use case
   *
   * @param props - Organization unit creation properties
   * @returns Created organization unit
   * @throws Error if code already exists
   * @throws Error if parent not found
   * @throws Error if max hierarchy depth exceeded
   */
  async execute(props: CreateOrganizationUnitProps): Promise<OrganizationUnit> {
    // Auto-generate code if not provided or empty
    const code =
      props.code ||
      (await this.codeGenerator.generateCode("ORGANIZATION_UNIT", "ORG"));

    // Check for duplicate code
    const existsByCode =
      await this.organizationUnitRepository.existsByCode(code);
    if (existsByCode) {
      throw new Error(`Organization unit with code "${code}" already exists`);
    }

    // Auto-calculate level based on parent hierarchy
    let level = 1;
    if (props.parentId) {
      const parent = await this.organizationUnitRepository.findById(
        props.parentId,
      );
      if (!parent) {
        throw new NotFoundError("Parent organization unit not found");
      }
      level = parent.level + 1;
      if (level > 10) {
        throw new Error(
          "Maximum organization unit hierarchy depth (10 levels) exceeded",
        );
      }
    }

    const organizationUnit = OrganizationUnit.create({ ...props, code, level });
    const created =
      await this.organizationUnitRepository.create(organizationUnit);
    return created;
  }
}
