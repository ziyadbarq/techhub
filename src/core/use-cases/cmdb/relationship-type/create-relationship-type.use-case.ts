import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeRepository } from "../../../repositories/relationship-type.repository.interface";
import {
  RelationshipType,
  type CreateRelationshipTypeProps,
} from "../../../domain/entities/relationship-type.entity";

export type CreateRelationshipTypeRequest = CreateRelationshipTypeProps;

@injectable()
export class CreateRelationshipTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private readonly relationshipTypeRepository: IRelationshipTypeRepository,
  ) {}

  async execute(
    request: CreateRelationshipTypeRequest,
  ): Promise<RelationshipType> {
    // Check if code already exists
    const exists = await this.relationshipTypeRepository.existsByCode(
      request.code,
    );
    if (exists) {
      throw new Error(
        `Relationship type with code already exists: ${request.code}`,
      );
    }

    const relationshipType = RelationshipType.create(request);
    return await this.relationshipTypeRepository.create(relationshipType);
  }
}
