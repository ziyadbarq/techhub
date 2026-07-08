/**
 * Create CIClassField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassFieldRepository } from "@/core/repositories/ci-class-field.repository.interface";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
import { CIClassField } from "@/core/domain/entities/ci-class-field.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CreateCIClassFieldRequest {
  ciClassId: string;
  fieldDefinitionId: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  defaultValue?: Record<string, unknown> | null;
  uiOrder?: number;
  note?: string | null;
}

@injectable()
export class CreateCIClassFieldUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassFieldRepository)
    private ciClassFieldRepository: ICIClassFieldRepository,
    @inject(DI_TOKENS.ICIClassRepository)
    private ciClassRepository: ICIClassRepository,
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private fieldDefinitionRepository: IFieldDefinitionRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(request: CreateCIClassFieldRequest): Promise<CIClassField> {
    // Verify CI class exists
    const ciClass = await this.ciClassRepository.findById(request.ciClassId);
    if (!ciClass) {
      throw new NotFoundError("CI class not found");
    }

    // Verify field definition exists
    const fieldDefinition = await this.fieldDefinitionRepository.findById(
      request.fieldDefinitionId,
    );
    if (!fieldDefinition) {
      throw new NotFoundError("Field definition not found");
    }

    // Check for duplicate
    const existing = await this.ciClassFieldRepository.exists(
      request.ciClassId,
      request.fieldDefinitionId,
    );
    if (existing) {
      throw new Error(
        "This field definition is already attached to this CI class",
      );
    }

    // Create entity
    const ciClassField = CIClassField.create({
      ciClassId: request.ciClassId,
      fieldDefinitionId: request.fieldDefinitionId,
      isRequired: request.isRequired,
      isUnique: request.isUnique,
      isVisible: request.isVisible,
      defaultValue: request.defaultValue,
      uiOrder: request.uiOrder,
      note: request.note,
    });

    // Persist
    return await this.ciClassFieldRepository.create(ciClassField);
  }
}
