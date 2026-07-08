import { injectable, inject } from "inversify";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRelationshipRepository } from "../../repositories/service-relationship.repository.interface";
import type {
  ServiceRelationship,
  UpdateServiceRelationshipProps,
} from "../../domain/entities/service-relationship.entity";

export interface UpdateServiceRelationshipRequest extends UpdateServiceRelationshipProps {
  id: string;
}

@injectable()
export class UpdateServiceRelationshipUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRelationshipRepository)
    private readonly serviceRelationshipRepository: IServiceRelationshipRepository,
  ) {}

  async execute(
    request: UpdateServiceRelationshipRequest,
  ): Promise<ServiceRelationship> {
    const relationship = await this.serviceRelationshipRepository.findById(
      request.id,
    );

    if (!relationship) {
      throw new NotFoundError(`Service relationship not found: ${request.id}`);
    }

    relationship.update({
      isCritical: request.isCritical,
      description: request.description,
      metadata: request.metadata,
      validTo: request.validTo,
      isActive: request.isActive,
    });

    return await this.serviceRelationshipRepository.update(relationship);
  }
}
