import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIRelationshipRepository } from "../../../repositories/ci-relationship.repository.interface";
import type { CIRelationship } from "../../../domain/entities/ci-relationship.entity";

export interface ListCIRelationshipsRequest {
  ciId?: string;
  relationshipTypeId?: string;
  activeOnly?: boolean;
}

@injectable()
export class ListCIRelationshipsUseCase {
  constructor(
    @inject(DI_TOKENS.ICIRelationshipRepository)
    private readonly ciRelationshipRepository: ICIRelationshipRepository,
  ) {}

  async execute(
    request: ListCIRelationshipsRequest = {},
  ): Promise<CIRelationship[]> {
    if (request.ciId) {
      return await this.ciRelationshipRepository.findByCi(request.ciId);
    }

    if (request.relationshipTypeId) {
      return await this.ciRelationshipRepository.findByRelationshipType(
        request.relationshipTypeId,
      );
    }

    if (request.activeOnly) {
      return await this.ciRelationshipRepository.findActiveRelationships();
    }

    return await this.ciRelationshipRepository.findAll();
  }
}
