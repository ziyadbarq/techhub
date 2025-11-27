import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRelationshipRepository } from "../../repositories/service-relationship.repository.interface";
import type { ServiceRelationship } from "../../domain/entities/service-relationship.entity";

export interface GetServiceRelationshipRequest {
  id: string;
}

@injectable()
export class GetServiceRelationshipUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRelationshipRepository)
    private readonly serviceRelationshipRepository: IServiceRelationshipRepository,
  ) {}

  async execute(
    request: GetServiceRelationshipRequest,
  ): Promise<ServiceRelationship | null> {
    return await this.serviceRelationshipRepository.findById(request.id);
  }
}
