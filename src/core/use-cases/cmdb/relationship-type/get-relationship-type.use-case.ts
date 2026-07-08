import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeRepository } from "../../../repositories/relationship-type.repository.interface";
import type { RelationshipType } from "../../../domain/entities/relationship-type.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetRelationshipTypeRequest {
  id?: string;
  code?: string;
}

@injectable()
export class GetRelationshipTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private readonly relationshipTypeRepository: IRelationshipTypeRepository,
  ) {}

  async execute(
    request: GetRelationshipTypeRequest,
  ): Promise<RelationshipType> {
    if (!request.id && !request.code) {
      throw new ValidationError("Either id or code must be provided");
    }

    let relationshipType: RelationshipType | null = null;

    if (request.id) {
      relationshipType = await this.relationshipTypeRepository.findById(
        request.id,
      );
    } else if (request.code) {
      relationshipType = await this.relationshipTypeRepository.findByCode(
        request.code,
      );
    }

    if (!relationshipType) {
      const identifier = request.id || request.code || "unknown";
      throw new NotFoundError(`Relationship type not found: ${identifier}`);
    }

    return relationshipType;
  }
}
