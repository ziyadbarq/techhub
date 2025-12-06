import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIRelationshipRepository } from "../../../repositories/ci-relationship.repository.interface";
import type { IRelationshipTypeRepository } from "../../../repositories/relationship-type.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import {
  CIRelationship,
  type CreateCIRelationshipProps,
} from "../../../domain/entities/ci-relationship.entity";

export type CreateCIRelationshipRequest = CreateCIRelationshipProps;

@injectable()
export class CreateCIRelationshipUseCase {
  constructor(
    @inject(DI_TOKENS.ICIRelationshipRepository)
    private readonly ciRelationshipRepository: ICIRelationshipRepository,
    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private readonly relationshipTypeRepository: IRelationshipTypeRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(request: CreateCIRelationshipRequest): Promise<CIRelationship> {
    // Verify relationship type exists
    const relationshipType = await this.relationshipTypeRepository.findById(
      request.relationshipTypeId,
    );
    if (!relationshipType) {
      throw new Error(
        `Relationship type not found: ${request.relationshipTypeId}`,
      );
    }

    // Check for existing relationship
    const exists = await this.ciRelationshipRepository.existsBetweenCis(
      request.fromCiId,
      request.toCiId,
      request.relationshipTypeId,
    );

    if (exists) {
      throw new Error("Relationship already exists between these CIs");
    }

    const relationship = CIRelationship.create(request, this.idGenerator);
    return await this.ciRelationshipRepository.create(relationship);
  }
}
