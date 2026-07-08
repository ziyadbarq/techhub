import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeRepository } from "../../../repositories/relationship-type.repository.interface";
import {
  RelationshipType,
  type CreateRelationshipTypeProps,
} from "../../../domain/entities/relationship-type.entity";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export type CreateRelationshipTypeRequest = CreateRelationshipTypeProps;

@injectable()
export class CreateRelationshipTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private readonly relationshipTypeRepository: IRelationshipTypeRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: CreateRelationshipTypeRequest,
  ): Promise<RelationshipType> {
    // Auto-generate code if not provided or empty
    const code =
      request.code ||
      (await this.codeGenerator.generateCode("RELATIONSHIP_TYPE", "REL"));

    // Check if code already exists
    const exists = await this.relationshipTypeRepository.existsByCode(code);
    if (exists) {
      throw new ConflictError(
        `Relationship type with code already exists: ${code}`,
      );
    }

    const relationshipType = RelationshipType.create(
      { ...request, code },
      this.idGenerator,
    );
    return await this.relationshipTypeRepository.create(relationshipType);
  }
}
