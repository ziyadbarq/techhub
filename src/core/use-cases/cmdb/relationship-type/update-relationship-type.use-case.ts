import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeRepository } from "../../../repositories/relationship-type.repository.interface";
import type {
  RelationshipType,
  UpdateRelationshipTypeProps,
} from "../../../domain/entities/relationship-type.entity";

export interface UpdateRelationshipTypeRequest {
  id: string;
  updates: UpdateRelationshipTypeProps;
}

@injectable()
export class UpdateRelationshipTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private readonly relationshipTypeRepository: IRelationshipTypeRepository,
  ) {}

  async execute(
    request: UpdateRelationshipTypeRequest,
  ): Promise<RelationshipType> {
    const relationshipType = await this.relationshipTypeRepository.findById(
      request.id,
    );

    if (!relationshipType) {
      throw new Error(`Relationship type not found: ${request.id}`);
    }

    relationshipType.update(request.updates);

    return await this.relationshipTypeRepository.update(relationshipType);
  }
}
