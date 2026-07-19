import { injectable, inject } from "inversify";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { DI_TOKENS } from "@/di/types";
import type { ICIRelationshipRepository } from "../../../repositories/ci-relationship.repository.interface";
import type {
  CIRelationship,
  UpdateCIRelationshipProps,
} from "../../../domain/entities/ci-relationship.entity";

export interface UpdateCIRelationshipRequest {
  id: string;
  updates: UpdateCIRelationshipProps;
}

@injectable()
export class UpdateCIRelationshipUseCase {
  constructor(
    @inject(DI_TOKENS.ICIRelationshipRepository)
    private readonly ciRelationshipRepository: ICIRelationshipRepository,
  ) {}

  async execute(request: UpdateCIRelationshipRequest): Promise<CIRelationship> {
    const relationship = await this.ciRelationshipRepository.findById(
      request.id,
    );

    if (!relationship) {
      throw new NotFoundError(`CI Relationship not found: ${request.id}`);
    }

    relationship.update(request.updates);

    return await this.ciRelationshipRepository.update(relationship);
  }
}
