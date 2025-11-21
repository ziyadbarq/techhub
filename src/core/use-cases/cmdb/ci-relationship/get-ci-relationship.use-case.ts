import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIRelationshipRepository } from "../../../repositories/ci-relationship.repository.interface";
import type { CIRelationship } from "../../../domain/entities/ci-relationship.entity";

export interface GetCIRelationshipRequest {
  id: string;
}

@injectable()
export class GetCIRelationshipUseCase {
  constructor(
    @inject(DI_TOKENS.ICIRelationshipRepository)
    private readonly ciRelationshipRepository: ICIRelationshipRepository,
  ) {}

  async execute(request: GetCIRelationshipRequest): Promise<CIRelationship> {
    const relationship = await this.ciRelationshipRepository.findById(
      request.id,
    );

    if (!relationship) {
      throw new Error(`CI Relationship not found: ${request.id}`);
    }

    return relationship;
  }
}
