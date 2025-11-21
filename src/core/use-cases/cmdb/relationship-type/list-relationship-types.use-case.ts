import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeRepository } from "../../../repositories/relationship-type.repository.interface";
import type { RelationshipType } from "../../../domain/entities/relationship-type.entity";

export interface ListRelationshipTypesRequest {
  bidirectionalOnly?: boolean;
  impactingOnly?: boolean;
}

@injectable()
export class ListRelationshipTypesUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private readonly relationshipTypeRepository: IRelationshipTypeRepository,
  ) {}

  async execute(
    request: ListRelationshipTypesRequest = {},
  ): Promise<RelationshipType[]> {
    if (request.bidirectionalOnly) {
      return await this.relationshipTypeRepository.findBidirectional();
    }

    if (request.impactingOnly) {
      return await this.relationshipTypeRepository.findImpacting();
    }

    return await this.relationshipTypeRepository.findAll();
  }
}
